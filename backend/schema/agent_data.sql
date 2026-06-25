-- agent_data table schema (Supabase / PostgreSQL)
-- Run in Supabase SQL Editor if the favourite column is missing.

-- Existing columns (from your project):
--   id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY
--   created_at      timestamptz NOT NULL DEFAULT now()
--   actress_name    text
--   actress_pic_url text

-- Add favourite column for star toggle:
ALTER TABLE public.agent_data
  ADD COLUMN IF NOT EXISTS favourite boolean NOT NULL DEFAULT false;

-- Optional: index for filtering favourites
CREATE INDEX IF NOT EXISTS idx_agent_data_favourite ON public.agent_data (favourite);
