-- Create tasks table for task management
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  is_agency_task BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
-- Users can view tasks assigned to them or agency-wide tasks
CREATE POLICY "Users can view their tasks and agency tasks"
ON public.tasks
FOR SELECT
USING (
  assigned_to = auth.uid() OR 
  is_agency_task = true OR 
  created_by = auth.uid()
);

-- Users can create tasks
CREATE POLICY "Users can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Users can update their own tasks, szef can update all tasks
CREATE POLICY "Users can update own tasks or szef updates all"
ON public.tasks
FOR UPDATE
USING (
  assigned_to = auth.uid() OR 
  created_by = auth.uid() OR 
  is_szef(auth.uid())
);

-- Users can delete their own created tasks, szef can delete all
CREATE POLICY "Users can delete own tasks or szef deletes all"
ON public.tasks
FOR DELETE
USING (
  created_by = auth.uid() OR 
  is_szef(auth.uid())
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();