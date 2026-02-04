-- Add industry column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS industry text;