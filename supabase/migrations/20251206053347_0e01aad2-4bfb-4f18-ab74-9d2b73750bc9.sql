
-- Fix calendar_events RLS: Only users with roles can view calendar events
-- This ensures even authenticated users without a role cannot access data

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all events" ON public.calendar_events;

-- Create new secure policy for calendar - only users with roles can view
CREATE POLICY "Team members can view all events"
ON public.calendar_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);
