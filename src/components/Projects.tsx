import { getProjects } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";

// Server component: runs on the server, reads Supabase there, sends HTML.
export async function Projects() {
  const projects = await getProjects();

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line p-6 text-muted">
        No projects to show yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
      ))}
    </div>
  );
}
