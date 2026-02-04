-- Create table for Zoho credentials
CREATE TABLE public.zoho_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_account text NOT NULL UNIQUE,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zoho_credentials ENABLE ROW LEVEL SECURITY;

-- Only szef can manage credentials
CREATE POLICY "Only szef can view credentials"
ON public.zoho_credentials
FOR SELECT
USING (is_szef(auth.uid()));

CREATE POLICY "Only szef can insert credentials"
ON public.zoho_credentials
FOR INSERT
WITH CHECK (is_szef(auth.uid()));

CREATE POLICY "Only szef can update credentials"
ON public.zoho_credentials
FOR UPDATE
USING (is_szef(auth.uid()));

CREATE POLICY "Only szef can delete credentials"
ON public.zoho_credentials
FOR DELETE
USING (is_szef(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_zoho_credentials_updated_at
BEFORE UPDATE ON public.zoho_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();