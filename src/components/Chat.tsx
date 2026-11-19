"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
// Type-only import: erased at build time, no server code reaches the browser.
import type { ChatMessage } from "@/lib/agent";
import type { Project } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

const MAX_LENGTH = 500;

export function Chat({ examples }: { examples: readonly string[] }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, clearError } = useChat<ChatMessage>();
  const busy = status === "submitted" || status === "streaming";
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);

  function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    clearError();
    sendMessage({ text: question });
    setInput("");
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      {messages.length > 0 && (
        <div className="mb-6 space-y-6" aria-live="polite">
          {messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} message={m} />
            ) : (
              <AssistantMessage key={m.id} message={m} />
            ),
          )}
          {status === "submitted" && <Thinking />}
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm" role="alert">
          {readableError(error)}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask me about my projects
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about my projects"
          maxLength={MAX_LENGTH}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-ink"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-bg transition-opacity disabled:opacity-40"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => ask(q)}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-left text-sm text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] text-bg">
        {text}
      </p>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .replace(/\*\*|__/g, "") // the prompt forbids markdown; this is the safety net
    .trim();

  // Cards come from the TOOL RESULT (real database rows streamed from the
  // server), not from the model's text. The model cannot invent a card.
  // If the tool ran several times, the last call wins.
  let projects: Project[] = [];
  let searching = false;
  for (const part of message.parts) {
    if (part.type === "tool-search_projects") {
      if (part.state === "output-available") projects = part.output.projects;
      else if (part.state === "input-streaming" || part.state === "input-available") searching = true;
    }
  }

  return (
    <div className="space-y-4">
      {searching && !text && <Thinking label="Searching my projects" />}
      {text && <p className="max-w-prose text-[15px] leading-relaxed">{text}</p>}
      {projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Thinking({ label = "Thinking" }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 font-mono text-xs text-muted">
      <span className="inline-block size-1.5 animate-pulse rounded-full bg-accent" />
      {label}…
    </p>
  );
}

function readableError(error: Error) {
  // The server answers with a short plain-text message (e.g. rate limit).
  const msg = error.message?.trim();
  if (msg && msg.length < 200 && !msg.startsWith("{") && !msg.startsWith("<")) return msg;
  return "Something went wrong. Please try again in a moment.";
}
