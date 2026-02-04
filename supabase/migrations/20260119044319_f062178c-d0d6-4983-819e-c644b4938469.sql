-- Create table for documents visible in Aurine Academy client app
CREATE TABLE public.client_app_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_size INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster queries by client
CREATE INDEX idx_client_app_documents_client_id ON public.client_app_documents(client_id);
CREATE INDEX idx_client_app_documents_type ON public.client_app_documents(type);

-- Enable RLS
ALTER TABLE public.client_app_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies: team members can view and manage documents
CREATE POLICY "Team members can view client app documents"
ON public.client_app_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can insert client app documents"
ON public.client_app_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update client app documents"
ON public.client_app_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete client app documents"
ON public.client_app_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_client_app_documents_updated_at
BEFORE UPDATE ON public.client_app_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();