// Everything personal lives here. Edit this file, not the components.
// This file is imported by both the page and the agent's system prompt.

export const profile = {
  name: "Antoine Krajnc",
  role: "AI & Data Engineer",
  positioning:
    "I build LLM agents and data pipelines that run in production, from the Postgres schema to the streamed response.",
  email: "antoine@jedha.co",
  linkedin: "https://www.linkedin.com/in/antoinekrajnc/",
  github: "https://github.com/antoinekrajnc",

  // Short, verifiable facts the agent may use for "professional profile"
  // questions. The agent will not invent anything beyond this list and the
  // projects table. TODO: adjust to your real situation.
  facts: [
    "Based in Paris, France. Open to remote.",
    "Works in English and French.",
    "Core skills: Python, SQL, TypeScript, LLM agents, RAG, data pipelines.",
    "Best way to get in touch: email (antoine@jedha.co) or LinkedIn.",
  ],

  exampleQuestions: [
    "What's your strongest AI project?",
    "Have you shipped anything with Python and SQL?",
    "Quel projet as-tu fait dans l'éducation ?",
  ],
} as const;
