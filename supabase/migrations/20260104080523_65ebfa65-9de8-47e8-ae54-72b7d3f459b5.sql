-- Create social_media_posts table
CREATE TABLE public.social_media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  format TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- Team members can view all posts
CREATE POLICY "Team members can view posts"
ON public.social_media_posts
FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()));

-- Only szef can create posts
CREATE POLICY "Only szef can create posts"
ON public.social_media_posts
FOR INSERT
WITH CHECK (is_szef(auth.uid()));

-- Only szef can update posts
CREATE POLICY "Only szef can update posts"
ON public.social_media_posts
FOR UPDATE
USING (is_szef(auth.uid()));

-- Only szef can delete posts
CREATE POLICY "Only szef can delete posts"
ON public.social_media_posts
FOR DELETE
USING (is_szef(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_social_media_posts_updated_at
BEFORE UPDATE ON public.social_media_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for social media files
INSERT INTO storage.buckets (id, name, public) VALUES ('social-media', 'social-media', true);

-- Storage policies - public read access
CREATE POLICY "Public can view social media files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'social-media');

-- Only szef can upload files
CREATE POLICY "Only szef can upload social media files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'social-media' AND is_szef(auth.uid()));

-- Only szef can update files
CREATE POLICY "Only szef can update social media files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'social-media' AND is_szef(auth.uid()));

-- Only szef can delete files
CREATE POLICY "Only szef can delete social media files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'social-media' AND is_szef(auth.uid()));