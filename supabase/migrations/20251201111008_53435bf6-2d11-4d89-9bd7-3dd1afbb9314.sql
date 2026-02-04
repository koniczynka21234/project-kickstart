-- Add columns for tracking the follow-up sequence
-- Sequence: Cold Mail (Day 0) → SMS Follow-up (Day 2) → Email Follow-up 1 (Day 6) → Email Follow-up 2 (Day 10)

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS sms_follow_up_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_follow_up_date date,
ADD COLUMN IF NOT EXISTS email_follow_up_1_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_follow_up_1_date date,
ADD COLUMN IF NOT EXISTS email_follow_up_2_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_follow_up_2_date date;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.sms_follow_up_sent IS 'SMS follow-up sent 2 days after cold email';
COMMENT ON COLUMN public.leads.email_follow_up_1_sent IS 'First email follow-up sent 4 days after SMS (day 6)';
COMMENT ON COLUMN public.leads.email_follow_up_2_sent IS 'Second email follow-up sent 4 days after first follow-up (day 10)';