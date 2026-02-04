-- Add DELETE policy for notifications so users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);