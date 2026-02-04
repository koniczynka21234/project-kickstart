-- Table for tracking advance invoices that need final invoices
CREATE TABLE public.pending_final_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advance_invoice_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  advance_amount NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  expected_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  final_invoice_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.pending_final_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view pending final invoices"
  ON public.pending_final_invoices
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can create pending final invoices"
  ON public.pending_final_invoices
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can update pending final invoices"
  ON public.pending_final_invoices
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Only szef can delete pending final invoices"
  ON public.pending_final_invoices
  FOR DELETE
  USING (is_szef(auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_pending_final_invoices_status ON public.pending_final_invoices(status);
CREATE INDEX idx_pending_final_invoices_client_id ON public.pending_final_invoices(client_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_final_invoices;