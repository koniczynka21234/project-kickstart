-- Create announcement_comments table
CREATE TABLE public.announcement_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all comments"
ON public.announcement_comments
FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.announcement_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.announcement_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments or szef deletes all"
ON public.announcement_comments
FOR DELETE
USING ((auth.uid() = user_id) OR is_szef(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_announcement_comments_updated_at
BEFORE UPDATE ON public.announcement_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for announcement_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_comments;