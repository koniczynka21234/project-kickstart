-- Add business_manager_url field to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS business_manager_url text;