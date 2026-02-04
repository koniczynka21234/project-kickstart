-- Fix RLS policies for profiles table - restrict to team members only
DROP POLICY IF EXISTS "Team members can view all profiles" ON public.profiles;

CREATE POLICY "Team members can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
  )
);

-- Fix RLS for leads - already requires team membership, but add extra check
-- The current policy is correct but let's reinforce it
DROP POLICY IF EXISTS "Team members can view all leads" ON public.leads;

CREATE POLICY "Team members can view all leads" 
ON public.leads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
  )
);