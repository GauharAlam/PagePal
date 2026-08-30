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
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_customer ON public.user_plans(stripe_customer_id);

-- ================================================================
-- Atomic counter RPC (prevents race on concurrent requests)
-- ================================================================
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_field text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_field = 'daily_summaries' THEN
    UPDATE public.user_plans SET daily_summaries = daily_summaries + 1 WHERE user_id = p_user_id;
  ELSIF p_field = 'daily_chats' THEN
    UPDATE public.user_plans SET daily_chats = daily_chats + 1 WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- ================================================================
-- Updated_at for user_plans
-- ================================================================
ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ================================================================
-- BYOK — User API Keys (encrypted at rest in prod via vault)
-- Users can use PagePal Pro (managed keys) OR bring their own
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('anthropic','openai','gemini','deepseek','grok')),
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop old policy if re-running
DROP POLICY IF EXISTS "Users manage their api keys" ON public.user_api_keys;
CREATE POLICY "Users manage their api keys"
  ON public.user_api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON public.user_api_keys(provider);
