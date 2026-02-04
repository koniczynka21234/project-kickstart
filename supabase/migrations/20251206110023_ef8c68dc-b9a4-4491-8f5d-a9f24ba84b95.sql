-- Add lead_id column to documents table for linking documents to leads
ALTER TABLE public.documents 
ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_documents_lead_id ON public.documents(lead_id);