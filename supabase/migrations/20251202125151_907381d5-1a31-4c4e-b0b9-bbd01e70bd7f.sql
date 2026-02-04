-- Team announcements from Szef
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_pinned boolean NOT NULL DEFAULT false
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view announcements"
ON public.announcements FOR SELECT
USING (true);

CREATE POLICY "Only szef can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (is_szef(auth.uid()));

CREATE POLICY "Only szef can update announcements"
ON public.announcements FOR UPDATE
USING (is_szef(auth.uid()));

CREATE POLICY "Only szef can delete announcements"
ON public.announcements FOR DELETE
USING (is_szef(auth.uid()));

-- Team chat messages
CREATE TABLE public.team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  reply_to_id uuid REFERENCES public.team_messages(id) ON DELETE SET NULL,
  reference_type text, -- 'document', 'client', 'lead', 'campaign'
  reference_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view messages"
ON public.team_messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create messages"
ON public.team_messages FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own messages"
ON public.team_messages FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own messages or szef deletes all"
ON public.team_messages FOR DELETE
USING (user_id = auth.uid() OR is_szef(auth.uid()));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER TABLE public.team_messages REPLICA IDENTITY FULL;