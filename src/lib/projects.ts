import "server-only";
import { cacheLife } from "next/cache";
import { getSupabase } from "./supabase";
import type { Project } from "./types";

const COLUMNS =
  "id, title, problem, what_i_built, stack, industry, key_result, demo_url, video_url, position";

// All projects, for the Projects section.
// "use cache" stores the result on the server for a few minutes, so the page
// is fast and we don't hit Supabase on every visit. Edits in the Supabase
// dashboard show up within minutes.
export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("minutes");

  const { data, error } = await getSupabase()
    .from("projects")
    .select(COLUMNS)
    .order("position", { ascending: true });

  if (error) {
    console.error("[projects] failed to load:", error.message);
    return [];
  }
  return data ?? [];
}

// Used by the agent's tool. Calls the search_projects() Postgres function.
export async function searchProjects(input: {
  keywords: string[];
  skills: string[];
  industry?: string;
}): Promise<Project[]> {
  const keywords = input.keywords.map((k) => k.trim()).filter(Boolean);
  const skills = input.skills.map((k) => k.trim()).filter(Boolean);
  const industry = input.industry?.trim() || null;

  // No criteria = "show me everything" (e.g. "tell me about your projects").
  if (keywords.length === 0 && skills.length === 0 && !industry) {
    return getProjects();
  }

  const { data, error } = await getSupabase().rpc("search_projects", {
    keywords,
    skills,
    industry_filter: industry,
  });

  if (error) {
    console.error("[search_projects] failed:", error.message);
    throw new Error("Project search is unavailable right now.");
  }
  return ((data ?? []) as Project[]).map(pick);
}

// Return only the public fields, in a stable shape.
function pick(p: Project): Project {
  return {
    id: p.id,
    title: p.title,
    problem: p.problem,
    what_i_built: p.what_i_built,
    stack: p.stack,
    industry: p.industry,
    key_result: p.key_result,
    demo_url: p.demo_url,
    video_url: p.video_url,
    position: p.position,
  };
}
