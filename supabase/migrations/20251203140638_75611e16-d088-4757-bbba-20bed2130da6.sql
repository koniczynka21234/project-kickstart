-- Expand app_permission enum with all needed permissions
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'leads_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'leads_create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'leads_edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'leads_delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'clients_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'clients_create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'clients_edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'clients_delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'campaigns_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'campaigns_create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'campaigns_edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'campaigns_delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'documents_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'documents_create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'documents_edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'documents_delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'tasks_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'tasks_create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'tasks_edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'tasks_delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reports_generate';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'invoices_generate';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'contracts_generate';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'presentations_generate';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'team_manage';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'roles_manage';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'calendar_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'calendar_manage';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'templates_manage';

-- Create lead_interactions table for contact history timeline
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'cold_email', 'sms', 'email_follow_up_1', 'email_follow_up_2', 'call', 'meeting', 'note', 'status_change', 'response'
  title TEXT NOT NULL,
  content TEXT,
  old_value TEXT,
  new_value TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_interactions
CREATE POLICY "Authenticated users can view all interactions" 
ON public.lead_interactions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create interactions" 
ON public.lead_interactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own interactions or szef updates all" 
ON public.lead_interactions 
FOR UPDATE 
USING ((created_by = auth.uid()) OR is_szef(auth.uid()));

CREATE POLICY "Users can delete own interactions or szef deletes all" 
ON public.lead_interactions 
FOR DELETE 
USING ((created_by = auth.uid()) OR is_szef(auth.uid()));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON public.lead_interactions(created_at DESC);