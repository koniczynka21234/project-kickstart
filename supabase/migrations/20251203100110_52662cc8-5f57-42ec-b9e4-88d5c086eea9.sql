-- Fix: Allow all authenticated users to update agency tasks (is_agency_task = true)
-- Since agency tasks are visible to everyone, they should be completable by everyone

DROP POLICY IF EXISTS "Users can update own tasks or szef updates all" ON public.tasks;

CREATE POLICY "Users can update own tasks or szef updates all" 
ON public.tasks 
FOR UPDATE 
USING (
  (assigned_to = auth.uid()) 
  OR (created_by = auth.uid()) 
  OR is_szef(auth.uid())
  OR (is_agency_task = true)
);