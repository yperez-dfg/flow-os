-- Run this in Supabase Dashboard → SQL Editor

create table if not exists personal_tasks (
  id text primary key,
  title text not null,
  done boolean default false,
  priority text default 'Medium',
  due text default '',
  repeat text default 'none',
  created_at text default ''
);

create table if not exists weekly_goals (
  id text primary key,
  title text not null,
  target integer default 5,
  current integer default 0,
  unit text default 'times',
  week_of text default ''
);

create table if not exists long_term_goals (
  id text primary key,
  title text not null,
  description text default '',
  category text default 'Personal',
  target_date text default '',
  progress integer default 0,
  created_at text default ''
);

create table if not exists routines (
  id text primary key,
  name text not null,
  emoji text default '☀️',
  steps jsonb default '[]',
  progress_date text default '',
  completed_step_ids text[] default '{}',
  created_at text default ''
);

create table if not exists meal_log (
  id text primary key,
  name text not null,
  calories integer default 0,
  protein integer default 0,
  carbs integer default 0,
  fat integer default 0,
  time text default '',
  log_date text default ''
);

-- Disable RLS so the anon key can read/write (single-user personal app)
alter table personal_tasks disable row level security;
alter table weekly_goals disable row level security;
alter table long_term_goals disable row level security;
alter table routines disable row level security;
alter table meal_log disable row level security;

-- Morning Brief daily cache (one row per date, avoids repeat Groq calls)
create table if not exists morning_briefs (
  date text primary key,
  bullets jsonb default '[]',
  focus text default '',
  created_at text default ''
);

alter table morning_briefs disable row level security;

-- Per-day exercise completion log (log_key = "Mon-2026-06-09", exercises = completed exercise names)
create table if not exists exercise_log (
  log_key text primary key,
  exercises text[] default '{}',
  created_at text default ''
);

alter table exercise_log disable row level security;
