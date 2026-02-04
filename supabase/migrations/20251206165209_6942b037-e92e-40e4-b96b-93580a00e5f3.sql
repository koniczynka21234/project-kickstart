-- Create table for auto follow-up logs
CREATE TABLE public.auto_followup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_name TEXT,
  email_to TEXT NOT NULL,
  email_from TEXT NOT NULL,
  template_name TEXT,
  followup_type TEXT NOT NULL, -- 'followup_1' or 'followup_2'
  status TEXT NOT NULL, -- 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auto_followup_logs ENABLE ROW LEVEL SECURITY;

-- Only szef and pracownik with roles can view logs
CREATE POLICY "Users with roles can view auto followup logs"
ON public.auto_followup_logs
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

-- Enable realtime for logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_followup_logs;