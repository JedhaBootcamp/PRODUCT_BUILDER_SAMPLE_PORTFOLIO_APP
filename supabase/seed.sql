-- =====================================================================
-- Seed: YOUR projects. Replace every example below with real ones, then
-- run in Supabase > SQL Editor. Re-running wipes and re-inserts.
--
-- Tips for a recruiter reading in 30 seconds:
--   problem     -> one line, the pain, not the tech
--   key_result  -> a number (time saved, users, accuracy, revenue)
--   stack       -> the exact names a recruiter would search for
-- =====================================================================

truncate table public.projects;

insert into public.projects
  (title, problem, what_i_built, stack, industry, key_result, demo_url, video_url, position)
values
(
  -- TODO: replace with a real project
  'Admissions assistant agent',
  'The admissions team answered the same 50 questions by email every day.',
  'A RAG agent over the course catalogue and FAQ, with tool calls to the CRM to check application status, deployed as a chat widget on the website.',
  array['Python', 'LangChain', 'PostgreSQL', 'pgvector', 'FastAPI', 'Mistral'],
  'Education',
  '62% of inbound questions answered without a human',
  'https://example.com/demo-admissions',
  'https://example.com/video-admissions',
  1
),
(
  -- TODO: replace with a real project
  'Churn prediction pipeline',
  'Customer success found out about churn when the cancellation email arrived.',
  'A daily pipeline that pulls product usage events, trains a gradient-boosted model and pushes a risk score into the CRM, with a dashboard for the CS team.',
  array['Python', 'SQL', 'dbt', 'XGBoost', 'Airflow', 'BigQuery'],
  'SaaS',
  'At-risk accounts flagged 3 weeks earlier on average',
  'https://example.com/demo-churn',
  null,
  2
),
(
  -- TODO: replace with a real project
  'Portfolio site with an AI agent',
  'Recruiters spend 30 seconds on a portfolio and leave with no answers.',
  'This website: a Next.js page with a streaming agent that searches my projects in Postgres through a single tool call, with rate limiting and RLS.',
  array['TypeScript', 'Next.js', 'Supabase', 'PostgreSQL', 'Vercel AI SDK', 'Tailwind'],
  'Recruiting',
  'Answers a recruiter question in under 3 seconds',
  'https://example.com',
  null,
  3
);
