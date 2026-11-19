import "server-only";
import { createHash } from "node:crypto";
import { getSupabase } from "./supabase";
import { requireEnv } from "./env";

// Identify a visitor without storing who they are:
// SHA-256(IP + secret salt). Same visitor -> same hash, but the hash can't be
// turned back into an IP, and without the salt nobody can precompute it.
export function visitorHash(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for"); // set by Vercel
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${requireEnv("RATE_LIMIT_SALT")}:${ip}`).digest("hex");
}

// true = allowed (and counted), false = over 20 messages in the last hour.
// The counting happens in Postgres (check_rate_limit), in one locked step.
export async function allowMessage(hash: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("check_rate_limit", { p_visitor_hash: hash });
  if (error) {
    // Fail CLOSED: if we can't count, we don't call the paid LLM API.
    console.error("[rate-limit] check failed:", error.message);
    throw new Error("rate-limit-unavailable");
  }
  return data === true;
}
