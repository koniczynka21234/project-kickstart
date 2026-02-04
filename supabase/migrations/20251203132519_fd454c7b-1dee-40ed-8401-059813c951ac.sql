-- Create calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'custom', -- follow_up, meeting, call, task, custom
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  color TEXT DEFAULT 'pink',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_events
CREATE POLICY "Authenticated users can view all events"
  ON public.calendar_events FOR SELECT USING (true);

CREATE POLICY "Users can create events"
  ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own events or szef updates all"
  ON public.calendar_events FOR UPDATE USING (auth.uid() = created_by OR is_szef(auth.uid()));

CREATE POLICY "Users can delete own events or szef deletes all"
  ON public.calendar_events FOR DELETE USING (auth.uid() = created_by OR is_szef(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create SMS templates table
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_templates
CREATE POLICY "Authenticated users can view all SMS templates"
  ON public.sms_templates FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create SMS templates"
  ON public.sms_templates FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own templates or szef updates all"
  ON public.sms_templates FOR UPDATE USING (auth.uid() = created_by OR is_szef(auth.uid()));

CREATE POLICY "Users can delete own templates or szef deletes all"
  ON public.sms_templates FOR DELETE USING (auth.uid() = created_by OR is_szef(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create monthly reports table for history
CREATE TABLE public.monthly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_reports
CREATE POLICY "Authenticated users can view all reports"
  ON public.monthly_reports FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON public.monthly_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update reports"
  ON public.monthly_reports FOR UPDATE USING (is_szef(auth.uid()));

CREATE POLICY "Szef can delete reports"
  ON public.monthly_reports FOR DELETE USING (is_szef(auth.uid()));