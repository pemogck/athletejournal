-- ============================================================
-- Athlete Journal - Supabase Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tables ──────────────────────────────────────────────────

create table if not exists public.athlete_profile (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique not null references auth.users(id) on delete cascade,
  first_name  text not null default '',
  birth_year  int,
  favorite_sport text,
  created_at  timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entry_date      date not null,
  sport           text not null,
  activity_type   text not null,
  minutes         int not null check (minutes > 0 and minutes <= 600),
  effort          int not null check (effort between 1 and 5),
  confidence      int not null check (confidence between 1 and 5),
  body_feel       text not null check (body_feel in ('Great', 'OK', 'Sore', 'Hurt')),
  win_today       varchar(140) not null default '',
  lesson_today    varchar(140) not null default '',
  tomorrow_focus  varchar(140) not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- One entry per user per day
  unique (user_id, entry_date)
);

create table if not exists public.monthly_reflections (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  month               text not null, -- YYYY-MM
  biggest_win_month   text not null default '',
  improve_next_month  text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, month)
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
create index if not exists idx_journal_entries_entry_date on public.journal_entries(entry_date);
create index if not exists idx_journal_entries_user_date on public.journal_entries(user_id, entry_date desc);

-- ── Row Level Security ────────────────────────────────────────
alter table public.athlete_profile enable row level security;
alter table public.journal_entries enable row level security;
alter table public.monthly_reflections enable row level security;

-- athlete_profile policies
create policy "Users can view own profile"
  on public.athlete_profile for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.athlete_profile for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.athlete_profile for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- journal_entries policies
create policy "Users can view own entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- monthly_reflections policies
create policy "Users can view own reflections"
  on public.monthly_reflections for select
  using (auth.uid() = user_id);

create policy "Users can upsert own reflections"
  on public.monthly_reflections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reflections"
  on public.monthly_reflections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Updated_at trigger ───────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute procedure public.handle_updated_at();

create trigger monthly_reflections_updated_at
  before update on public.monthly_reflections
  for each row execute procedure public.handle_updated_at();
