-- =====================================================================
-- Portfolio schema. Run once in Supabase > SQL Editor > New query.
-- Safe to re-run: everything is "if not exists" / "or replace".
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  problem       text not null,              -- the problem, in one line
  what_i_built  text not null,              -- what you actually built
  stack         text[] not null default '{}',
  industry      text,
  key_result    text,                       -- the number a recruiter remembers
  demo_url      text,
  video_url     text,
  position      int not null default 0,     -- display order (lowest first)
  created_at    timestamptz not null default now()
);

-- Row Level Security: with RLS on, NOTHING is allowed unless a policy says so.
-- We add exactly one policy: anyone may READ. No insert/update/delete policy,
-- so the API keys used by the website can never modify projects.
-- You edit projects from the Supabase dashboard (which bypasses RLS).
alter table public.projects enable row level security;

drop policy if exists "Projects are publicly readable" on public.projects;
create policy "Projects are publicly readable"
  on public.projects for select
  to anon, authenticated
  using (true);

-- Table-level permission (Supabase grants this by default; explicit here).
-- Read only: even if a write policy were added by mistake, there is no grant.
grant select on public.projects to anon, authenticated;
revoke insert, update, delete, truncate on public.projects from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Search used by the agent's `search_projects` tool
-- ---------------------------------------------------------------------
-- Whole-word, case-insensitive match. Works for terms like "C++" or
-- "Node.js" (regex special characters are escaped) and avoids "AI"
-- matching inside "maintain".
create or replace function public.word_match(haystack text, needle text)
returns boolean
language sql immutable
as $$
  select coalesce(haystack, '') ~* (
    '(^|[^[:alnum:]])'
    || regexp_replace(needle, '([.*+?^${}()|\[\]\\])', '\\\1', 'g')
    || '($|[^[:alnum:]])'
  );
$$;

-- Returns projects matching ANY of the criteria, best matches first.
-- Score: +3 per matching skill, +2 if the industry matches, +1 per keyword.
-- "security invoker" = runs with the caller's rights, so the RLS read policy
-- above still applies.
create or replace function public.search_projects(
  keywords text[] default '{}',
  skills   text[] default '{}',
  industry_filter text default null
)
returns setof public.projects
language sql stable
security invoker
set search_path = public
as $$
  with scored as (
    select p.*,
      (
        select count(*) * 3 from unnest(coalesce(skills, '{}')) s
        where exists (select 1 from unnest(p.stack) t where public.word_match(t, s))
      )
      + case when coalesce(industry_filter, '') <> ''
                  and public.word_match(p.industry, industry_filter) then 2 else 0 end
      + (
        select count(*) from unnest(coalesce(keywords, '{}')) k
        where length(trim(k)) > 1 and (
             public.word_match(p.title, k)
          or public.word_match(p.problem, k)
          or public.word_match(p.what_i_built, k)
          or public.word_match(p.industry, k)
          or public.word_match(p.key_result, k)
          or exists (select 1 from unnest(p.stack) t where public.word_match(t, k))
        )
      ) as score
    from public.projects p
  )
  select id, title, problem, what_i_built, stack, industry, key_result,
         demo_url, video_url, position, created_at
  from scored
  where score > 0
  order by score desc, position asc
  limit 6;
$$;

grant execute on function public.search_projects(text[], text[], text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Rate limiting for the chat (20 messages / visitor / rolling hour)
-- ---------------------------------------------------------------------
-- One row per accepted message. visitor_hash is a SHA-256 of the visitor's
-- IP + a secret salt, computed on the server: no raw IP is ever stored.
create table if not exists public.chat_rate_limits (
  id           bigint generated always as identity primary key,
  visitor_hash text not null,
  created_at   timestamptz not null default now()
);
create index if not exists chat_rate_limits_visitor_time
  on public.chat_rate_limits (visitor_hash, created_at);

-- RLS on with NO policy: nobody can read or write this table through the API.
alter table public.chat_rate_limits enable row level security;
revoke all on public.chat_rate_limits from anon, authenticated;

-- The only way in is this function. "security definer" = it runs with the
-- rights of its owner, so it can write to the locked table, but it only does
-- one thing: count + record a message. The limit (20) is hardcoded here so a
-- caller cannot pass a bigger one.
create or replace function public.check_rate_limit(p_visitor_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if p_visitor_hash is null or length(p_visitor_hash) <> 64 then
    return false;
  end if;

  -- Serialize requests from the same visitor so two simultaneous messages
  -- cannot both read "19" and both get through.
  perform pg_advisory_xact_lock(hashtext(p_visitor_hash));

  select count(*) into recent
  from chat_rate_limits
  where visitor_hash = p_visitor_hash
    and created_at > now() - interval '1 hour';

  if recent >= 20 then
    return false;
  end if;

  insert into chat_rate_limits (visitor_hash) values (p_visitor_hash);

  -- Housekeeping: occasionally drop rows older than a day.
  if random() < 0.02 then
    delete from chat_rate_limits where created_at < now() - interval '1 day';
  end if;

  return true;
end;
$$;

revoke all on function public.check_rate_limit(text) from public;
grant execute on function public.check_rate_limit(text) to anon, authenticated;
