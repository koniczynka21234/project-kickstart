-- Create email_templates table for managing cold email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Authenticated users can view all templates"
ON public.email_templates
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create templates"
ON public.email_templates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own templates or szef updates all"
ON public.email_templates
FOR UPDATE
USING ((created_by = auth.uid()) OR is_szef(auth.uid()));

CREATE POLICY "Users can delete own templates or szef deletes all"
ON public.email_templates
FOR DELETE
USING ((created_by = auth.uid()) OR is_szef(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add assigned_to field to clients table for employee assignment
ALTER TABLE public.clients
ADD COLUMN assigned_to UUID REFERENCES auth.users(id);

-- Insert default email templates
INSERT INTO public.email_templates (template_name, subject, body) VALUES
('szablon1', 'Profesjonalne kampanie Facebook Ads dla Twojego salonu', 'Cześć! Specjalizujemy się w kampaniach Facebook Ads dla salonów beauty...'),
('szablon2', 'Zwiększ rezerwacje w swoim salonie dzięki Facebook Ads', 'Dzień dobry! Zauważyliśmy Twój salon i chcielibyśmy pomóc...'),
('szablon3', 'Eksperci od reklam Facebook dla branży beauty', 'Witaj! Jesteśmy agencją specjalizującą się w reklamach dla salonów...'),
('szablon4', 'Bezpłatny audyt kampanii Facebook dla Twojego salonu', 'Cześć! Oferujemy bezpłatny audyt Twoich obecnych działań marketingowych...');