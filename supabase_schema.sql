-- ================================================================
-- PagePal AI — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ================================================================

-- Chat History
CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  page_url text,
  page_title text,
  messages jsonb,
  created_at timestamptz DEFAULT now()
);

-- Saved Summaries
CREATE TABLE IF NOT EXISTS public.saved_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  page_url text,
  page_title text,
  page_type text,
  summary text,
  key_points jsonb,
  timestamps jsonb,
  created_at timestamptz DEFAULT now()
);

-- User Plans (Free / Pro)
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan text DEFAULT 'free',
  daily_summaries int DEFAULT 0,
  daily_chats int DEFAULT 0,
  last_reset_date date DEFAULT current_date,
  stripe_customer_id text,
  stripe_subscription_id text
);

-- ================================================================
-- Row Level Security
-- ================================================================

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users manage their chat history"
  ON public.chat_history
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage their saved summaries"
  ON public.saved_summaries
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage their plans"
  ON public.user_plans
  FOR ALL
  USING (auth.uid() = user_id);

-- ================================================================
-- Indexes for performance
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_summaries_user_id ON public.saved_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_summaries_page_url ON public.saved_summaries(page_url);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
