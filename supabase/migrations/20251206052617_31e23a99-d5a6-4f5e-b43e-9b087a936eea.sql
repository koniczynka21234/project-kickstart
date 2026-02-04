
-- Fix security: Only users with assigned roles can view profiles and leads
-- This ensures even authenticated users without a role cannot access data

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create new secure policy for profiles - only users with roles can view
CREATE POLICY "Team members can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- Drop existing policies for leads
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

-- Create new secure policies for leads - only users with roles can access
CREATE POLICY "Team members can view all leads"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create leads"
ON public.leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update leads"
ON public.leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete leads"
ON public.leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);
