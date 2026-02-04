-- Create task_comments table for task comments
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
-- Users can view comments on tasks they have access to
CREATE POLICY "Users can view comments on accessible tasks"
ON public.task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_comments.task_id
    AND (
      tasks.assigned_to = auth.uid() OR 
      tasks.is_agency_task = true OR 
      tasks.created_by = auth.uid() OR
      is_szef(auth.uid())
    )
  )
);

-- Users can create comments on tasks they have access to
CREATE POLICY "Users can create comments on accessible tasks"
ON public.task_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_comments.task_id
    AND (
      tasks.assigned_to = auth.uid() OR 
      tasks.is_agency_task = true OR 
      tasks.created_by = auth.uid() OR
      is_szef(auth.uid())
    )
  )
  AND user_id = auth.uid()
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.task_comments
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own comments or szef can delete all
CREATE POLICY "Users can delete own comments or szef deletes all"
ON public.task_comments
FOR DELETE
USING (user_id = auth.uid() OR is_szef(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);