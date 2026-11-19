// "server-only" makes the build FAIL if a client component ever imports this
// file. That is our guarantee that Supabase keys never reach the browser.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

export function getSupabase() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_PUBLISHABLE_KEY"),
    // No user login on this site: no session to store or refresh.
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
