-- Add cold email tracking fields to leads table
ALTER TABLE public.leads 
ADD COLUMN cold_email_sent boolean DEFAULT false,
ADD COLUMN cold_email_date date,
ADD COLUMN follow_up_count integer DEFAULT 0,
ADD COLUMN last_follow_up_date date,
ADD COLUMN next_follow_up_date date,
ADD COLUMN last_contact_date date,
ADD COLUMN response text,
ADD COLUMN response_date date,
ADD COLUMN priority text DEFAULT 'medium';

-- Add comment for clarity
COMMENT ON COLUMN public.leads.cold_email_sent IS 'Whether cold email was sent';
COMMENT ON COLUMN public.leads.cold_email_date IS 'Date when cold email was sent';
COMMENT ON COLUMN public.leads.follow_up_count IS 'Number of follow-ups sent';
COMMENT ON COLUMN public.leads.last_follow_up_date IS 'Date of last follow-up';
COMMENT ON COLUMN public.leads.next_follow_up_date IS 'Planned date for next follow-up';
COMMENT ON COLUMN public.leads.last_contact_date IS 'Date of last contact attempt';
COMMENT ON COLUMN public.leads.response IS 'Response received from lead';
COMMENT ON COLUMN public.leads.response_date IS 'Date when response was received';
COMMENT ON COLUMN public.leads.priority IS 'Lead priority: low, medium, high';