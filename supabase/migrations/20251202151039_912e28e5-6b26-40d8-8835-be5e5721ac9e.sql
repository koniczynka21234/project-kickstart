-- Add industry field to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry text;

-- Common beauty industry branches/types
COMMENT ON COLUMN public.leads.industry IS 'Industry/branch of the potential client (e.g., fryzjerstwo, kosmetyka, paznokcie, spa)';
