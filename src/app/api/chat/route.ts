import { createMistral } from "@ai-sdk/mistral";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT, tools, type ChatMessage } from "@/lib/agent";
import { allowMessage, visitorHash } from "@/lib/rate-limit";
import { trimAfterAnswer } from "@/lib/trim-stream";
import { requireEnv } from "@/lib/env";

export const maxDuration = 30;

const MAX_MESSAGES = 10; // only the last 10 messages are sent to the model
const MAX_CHARS = 500; // per message

// Never trust the browser. We accept ONLY text from the client, and rebuild
// a clean history from it. Tool results sent by the client are dropped,
// so nobody can forge a fake "search_projects" result with an invented project.
const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().max(100),
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.looseObject({ type: z.string() })).max(20),
      }),
    )
    .min(1)
    .max(100),
});

function text(status: number, message: string) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(req: Request) {
  // 1. Validate the request shape.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return text(400, "Invalid request.");

  const history: ChatMessage[] = parsed.data.messages.slice(-MAX_MESSAGES).map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts.flatMap((p) =>
      p.type === "text" && typeof p.text === "string"
        ? [{ type: "text" as const, text: p.text.slice(0, MAX_CHARS) }]
        : [],
    ),
  }));

  const last = history.at(-1);
  const question = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();
  if (last?.role !== "user" || !question) return text(400, "Please type a question.");

  // 2. Rate limit BEFORE calling the LLM (that's the part that costs money).
  try {
    if (!(await allowMessage(visitorHash(req)))) {
      return text(429, "You've reached the limit of 20 questions per hour. Feel free to email me directly!");
    }
  } catch {
    return text(503, "The assistant is temporarily unavailable. Please try again later.");
  }

  // 3. Call the model with the single tool, and stream the answer back.
  const mistral = createMistral({ apiKey: requireEnv("MISTRAL_API_KEY") });

  const result = streamText({
    // mistral-small: the cheapest Mistral model that passed all our tests.
    // (ministral-3b is cheaper but fell for prompt injection in testing.)
    // Reasoning OFF: reasoning tokens would eat the 300-token budget.
    model: mistral(process.env.MISTRAL_MODEL || "mistral-small-latest"),
    reasoning: "none",
    instructions: SYSTEM_PROMPT,
    messages: await convertToModelMessages(history),
    tools,
    // Step 1: model decides to call search_projects. Step 2: it writes the
    // answer from the results. 3 leaves room for one refined search.
    stopWhen: isStepCount(3),
    maxOutputTokens: 300, // hard cap on answer length (and cost)
    temperature: 0.2, // low = consistent, factual answers
    experimental_transform: trimAfterAnswer(),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // Don't leak internal error details (DB, API) to the browser.
      onError: () => "Something went wrong. Please try again.",
    }),
  });
}
