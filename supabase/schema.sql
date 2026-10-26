-- ==============================================================================
-- HabitFlow Production Database Schema & Security Policies
-- Database: PostgreSQL (Supabase)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTION: auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABLE 1: profiles
-- User profile information linked to Supabase auth.users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  theme TEXT DEFAULT 'light' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Safe profile creation function & trigger on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'HabitFlow User'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if existing and recreate safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- TABLE 2: habits
-- Stores the habits created by users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Personal',
  icon TEXT NOT NULL DEFAULT 'check-circle',
  color TEXT NOT NULL DEFAULT '#244C3A',
  schedule JSONB NOT NULL DEFAULT '{"type": "daily"}'::jsonb,
  target_value NUMERIC CHECK (target_value IS NULL OR target_value > 0),
  target_unit TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for habits
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON public.habits(user_id, archived_at);

-- Trigger for habits updated_at
DROP TRIGGER IF EXISTS set_habits_updated_at ON public.habits;
CREATE TRIGGER set_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- TABLE 3: habit_entries
-- Daily completion and progress records for habits
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  progress_value NUMERIC CHECK (progress_value IS NULL OR progress_value >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent duplicate entries for the same habit and date
  CONSTRAINT unique_habit_date_entry UNIQUE (habit_id, entry_date)
);

-- Indexes for habit_entries
CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_date ON public.habit_entries(habit_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_date ON public.habit_entries(user_id, entry_date);

-- Trigger for habit_entries updated_at
DROP TRIGGER IF EXISTS set_habit_entries_updated_at ON public.habit_entries;
CREATE TRIGGER set_habit_entries_updated_at
  BEFORE UPDATE ON public.habit_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Ownership integrity trigger: ensures habit belongs to the same user
CREATE OR REPLACE FUNCTION public.check_entry_habit_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.habits
    WHERE id = NEW.habit_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Ownership mismatch: Habit % does not belong to user %', NEW.habit_id, NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_entry_ownership ON public.habit_entries;
CREATE TRIGGER enforce_entry_ownership
  BEFORE INSERT OR UPDATE ON public.habit_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_entry_habit_ownership();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Mandatory isolation: Users may strictly access and mutate only their own data
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- HABITS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "Users can view own habits"
  ON public.habits
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits"
  ON public.habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits"
  ON public.habits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits"
  ON public.habits
  FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- HABIT ENTRIES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own entries" ON public.habit_entries;
CREATE POLICY "Users can view own entries"
  ON public.habit_entries
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own entries with valid habit ownership" ON public.habit_entries;
CREATE POLICY "Users can insert own entries with valid habit ownership"
  ON public.habit_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_id AND habits.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own entries with valid habit ownership" ON public.habit_entries;
CREATE POLICY "Users can update own entries with valid habit ownership"
  ON public.habit_entries
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_id AND habits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_id AND habits.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own entries" ON public.habit_entries;
CREATE POLICY "Users can delete own entries"
  ON public.habit_entries
  FOR DELETE
  USING (auth.uid() = user_id);
