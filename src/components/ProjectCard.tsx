import type { Project } from "@/lib/types";

// One card design, used twice: in the Projects section and under agent answers.
// No "use client" needed: it has no state, so it works on server and client.
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 sm:p-6">
      {project.industry && (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {project.industry}
        </p>
      )}
      <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight">{project.title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{project.problem}</p>

      {project.key_result && (
        <p className="mt-4 border-l-2 border-accent pl-3 text-[15px] font-medium leading-snug">
          {project.key_result}
        </p>
      )}

      {project.stack.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Stack">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>
      )}

      {(project.demo_url || project.video_url) && (
        <div className="mt-auto flex gap-2 pt-6">
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-85"
            >
              Live demo ↗
            </a>
          )}
          {project.video_url && (
            <a
              href={project.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium transition-colors hover:border-ink"
            >
              Watch video ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}
