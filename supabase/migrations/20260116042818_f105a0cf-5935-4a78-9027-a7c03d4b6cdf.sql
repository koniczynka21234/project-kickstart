-- Tabela kodów abonamentowych
CREATE TABLE public.subscription_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_email TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela treści aplikacji klienckiej
CREATE TABLE public.client_app_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('course', 'material', 'guide', 'video')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela powiadomień do aplikacji klienckiej
CREATE TABLE public.client_app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info' CHECK (notification_type IN ('info', 'campaign_update', 'new_content', 'document')),
  link_type TEXT CHECK (link_type IN ('campaign', 'document', 'content')),
  link_id UUID,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela aktywności z aplikacji klienckiej (do synchronizacji)
CREATE TABLE public.client_app_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  subscription_code TEXT,
  user_email TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Włącz RLS dla wszystkich tabel
ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_app_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_app_activity ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla subscription_codes
CREATE POLICY "Team members can view subscription codes"
  ON public.subscription_codes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can create subscription codes"
  ON public.subscription_codes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can update subscription codes"
  ON public.subscription_codes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Only szef can delete subscription codes"
  ON public.subscription_codes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'szef'));

-- Polityki RLS dla client_app_content
CREATE POLICY "Team members can view client app content"
  ON public.client_app_content FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can create client app content"
  ON public.client_app_content FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can update client app content"
  ON public.client_app_content FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Only szef can delete client app content"
  ON public.client_app_content FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'szef'));

-- Polityki RLS dla client_app_notifications
CREATE POLICY "Team members can view client app notifications"
  ON public.client_app_notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can create client app notifications"
  ON public.client_app_notifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can update client app notifications"
  ON public.client_app_notifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Only szef can delete client app notifications"
  ON public.client_app_notifications FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'szef'));

-- Polityki RLS dla client_app_activity
CREATE POLICY "Team members can view client app activity"
  ON public.client_app_activity FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "Team members can create client app activity"
  ON public.client_app_activity FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

-- Trigger do aktualizacji updated_at
CREATE TRIGGER update_subscription_codes_updated_at
  BEFORE UPDATE ON public.subscription_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_app_content_updated_at
  BEFORE UPDATE ON public.client_app_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Funkcja do generowania unikalnego kodu
CREATE OR REPLACE FUNCTION public.generate_subscription_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Włącz realtime dla tabel
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_app_activity;