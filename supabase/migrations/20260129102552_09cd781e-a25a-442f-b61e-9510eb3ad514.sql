-- Create payments tracking table linked to invoices/documents
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Only szef can view payments (financial data)
CREATE POLICY "Only szef can view payments"
ON public.payments
FOR SELECT
USING (is_szef(auth.uid()));

-- Only szef can create payments
CREATE POLICY "Only szef can create payments"
ON public.payments
FOR INSERT
WITH CHECK (is_szef(auth.uid()));

-- Only szef can update payments
CREATE POLICY "Only szef can update payments"
ON public.payments
FOR UPDATE
USING (is_szef(auth.uid()));

-- Only szef can delete payments
CREATE POLICY "Only szef can delete payments"
ON public.payments
FOR DELETE
USING (is_szef(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);

-- Enable realtime for payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;