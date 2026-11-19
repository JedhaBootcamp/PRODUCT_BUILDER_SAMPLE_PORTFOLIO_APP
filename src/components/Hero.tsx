import { profile } from "@/config/profile";

export function Hero() {
  return (
    <header className="pt-16 pb-14 sm:pt-24 sm:pb-20">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">
        <span className="inline-block size-2 rounded-full bg-accent" aria-hidden />
        {profile.name} · {profile.role}
      </p>
      <h1 className="mt-6 max-w-[22ch] text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance sm:text-6xl">
        {profile.positioning}
      </h1>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${profile.email}`}
          className="rounded-lg bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink transition-opacity hover:opacity-90"
        >
          Contact me
        </a>
        <a
          href={profile.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-line px-5 py-3 text-[15px] font-medium transition-colors hover:border-ink"
        >
          LinkedIn
        </a>
        <a
          href={profile.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-line px-5 py-3 text-[15px] font-medium transition-colors hover:border-ink"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
