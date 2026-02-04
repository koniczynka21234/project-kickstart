-- Fix profiles table RLS - restrict to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Fix clients table RLS - restrict to authenticated users only  
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;

CREATE POLICY "Authenticated users can view all clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;

CREATE POLICY "Authenticated users can create clients" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;

CREATE POLICY "Authenticated users can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

CREATE POLICY "Authenticated users can delete clients" 
ON public.clients 
FOR DELETE 
TO authenticated
USING (true);