import { Suspense } from "react";
import { profile } from "@/config/profile";
import { Hero } from "@/components/Hero";
import { Chat } from "@/components/Chat";
import { Projects, ProjectsSkeleton } from "@/components/Projects";
import { SectionLabel } from "@/components/SectionLabel";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-8">
      <Hero />

      <section aria-labelledby="agent" className="pb-16">
        <SectionLabel id="agent" index="01" title="Ask my agent" />
        <Chat examples={profile.exampleQuestions} />
      </section>

      <section aria-labelledby="projects" className="pb-16">
        <SectionLabel id="projects" index="02" title="Projects" />
        <Suspense fallback={<ProjectsSkeleton />}>
          <Projects />
        </Suspense>
      </section>

      <footer className="border-t border-line pt-6 font-mono text-xs text-muted">
        © {profile.name} · Built with Next.js, Supabase and Mistral
      </footer>
    </main>
  );
}
