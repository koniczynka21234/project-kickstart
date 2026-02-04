-- Create storage bucket for document thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-thumbnails', 'document-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for document thumbnails bucket
CREATE POLICY "Team members can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'document-thumbnails' 
  AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-thumbnails');

CREATE POLICY "Users can delete own thumbnails or szef deletes all"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'document-thumbnails' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR is_szef(auth.uid())
  )
);