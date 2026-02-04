-- Fix campaigns RLS policies - restrict access based on user roles
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;

-- Create new secure policies for campaigns - only team members with roles can access
CREATE POLICY "Team members can view campaigns"
ON public.campaigns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update campaigns"
ON public.campaigns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Only szef can delete campaigns"
ON public.campaigns
FOR DELETE
USING (
  is_szef(auth.uid())
);

-- Fix campaign_metrics - restrict to team members with roles
DROP POLICY IF EXISTS "Authenticated users can view all metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Authenticated users can create metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Authenticated users can update metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Authenticated users can delete metrics" ON public.campaign_metrics;

CREATE POLICY "Team members can view metrics"
ON public.campaign_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create metrics"
ON public.campaign_metrics
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update metrics"
ON public.campaign_metrics
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Only szef can delete metrics"
ON public.campaign_metrics
FOR DELETE
USING (
  is_szef(auth.uid())
);

-- Fix clients table - restrict to team members with roles
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

CREATE POLICY "Team members can view clients"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create clients"
ON public.clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update clients"
ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Only szef can delete clients"
ON public.clients
FOR DELETE
USING (
  is_szef(auth.uid())
);