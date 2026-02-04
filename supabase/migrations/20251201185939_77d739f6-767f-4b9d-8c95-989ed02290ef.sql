-- Add facebook_page field to clients table if not exists
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS facebook_page text;

COMMENT ON COLUMN public.clients.facebook_page IS 'Facebook page URL of the salon';