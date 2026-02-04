-- Create table for client visibility settings
CREATE TABLE public.client_visibility_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  show_campaigns BOOLEAN NOT NULL DEFAULT true,
  show_guardian BOOLEAN NOT NULL DEFAULT true,
  show_documents BOOLEAN NOT NULL DEFAULT true,
  visible_document_types TEXT[] DEFAULT ARRAY['invoice', 'contract', 'report', 'presentation', 'welcome_pack']::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE public.client_visibility_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Team members can view visibility settings"
ON public.client_visibility_settings
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can create visibility settings"
ON public.client_visibility_settings
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can update visibility settings"
ON public.client_visibility_settings
FOR UPDATE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Only szef can delete visibility settings"
ON public.client_visibility_settings
FOR DELETE
USING (is_szef(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_client_visibility_settings_updated_at
BEFORE UPDATE ON public.client_visibility_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default visibility settings for existing clients
INSERT INTO public.client_visibility_settings (client_id)
SELECT id FROM public.clients
ON CONFLICT (client_id) DO NOTHING;