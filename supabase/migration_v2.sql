-- ============================================================
-- Athlete Journal - Migration v2
-- Run this in the Supabase SQL Editor AFTER migration.sql
-- ============================================================

-- 1. Add energy rating column
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS energy int CHECK (energy BETWEEN 1 AND 5);

-- 2. Rename body_feel → body_feel_before
ALTER TABLE public.journal_entries
  RENAME COLUMN body_feel TO body_feel_before;

-- 3. Add body_feel_after column (nullable - athlete fills after session)
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS body_feel_after text
  CHECK (body_feel_after IN ('Great', 'OK', 'Sore', 'Hurt'));

-- 4. Create entry_sports table (replaces single sport/minutes on journal_entries)
CREATE TABLE IF NOT EXISTS public.entry_sports (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id    uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport       text NOT NULL,
  minutes     int NOT NULL CHECK (minutes > 0 AND minutes <= 600),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. Migrate existing sport/minutes data into entry_sports
INSERT INTO public.entry_sports (entry_id, user_id, sport, minutes)
SELECT id, user_id, sport, minutes
FROM public.journal_entries
WHERE sport IS NOT NULL AND minutes IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Make sport and minutes nullable on journal_entries (now stored in entry_sports)
ALTER TABLE public.journal_entries
  ALTER COLUMN sport DROP NOT NULL;

ALTER TABLE public.journal_entries
  ALTER COLUMN minutes DROP NOT NULL;

-- Update minutes check to allow NULL
ALTER TABLE public.journal_entries
  DROP CONSTRAINT IF EXISTS journal_entries_minutes_check;

ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_minutes_check
  CHECK (minutes IS NULL OR (minutes > 0 AND minutes <= 600));

-- 7. Indexes for entry_sports
CREATE INDEX IF NOT EXISTS idx_entry_sports_entry_id ON public.entry_sports(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_sports_user_id  ON public.entry_sports(user_id);

-- 8. Row Level Security for entry_sports
ALTER TABLE public.entry_sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entry sports"
  ON public.entry_sports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entry sports"
  ON public.entry_sports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entry sports"
  ON public.entry_sports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entry sports"
  ON public.entry_sports FOR DELETE
  USING (auth.uid() = user_id);
