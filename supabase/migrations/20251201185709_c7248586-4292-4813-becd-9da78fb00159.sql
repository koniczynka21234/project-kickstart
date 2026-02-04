-- Add new fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_template text,
ADD COLUMN IF NOT EXISTS email_from text,
ADD COLUMN IF NOT EXISTS facebook_page text;

-- Add comment for clarity
COMMENT ON COLUMN public.leads.email_template IS 'Which email template was used (1-4)';
COMMENT ON COLUMN public.leads.email_from IS 'Email address used to send (kontakt@aurine.pl or biuro@aurine.pl)';
COMMENT ON COLUMN public.leads.facebook_page IS 'Facebook page URL of the salon';