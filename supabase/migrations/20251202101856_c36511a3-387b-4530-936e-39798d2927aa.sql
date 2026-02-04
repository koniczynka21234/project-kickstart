-- Add completed_by field to track who marked task as complete
ALTER TABLE public.tasks ADD COLUMN completed_by uuid REFERENCES auth.users(id);