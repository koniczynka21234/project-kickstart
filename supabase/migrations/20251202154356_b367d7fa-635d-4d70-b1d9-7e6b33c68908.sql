-- Add client_id to tasks for 360-degree client view
ALTER TABLE public.tasks ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);