-- Fix profiles table - ensure only authenticated can see
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix campaigns table - ensure only authenticated can see
DROP POLICY IF EXISTS "Authenticated users can view all campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can view all campaigns" 
ON public.campaigns 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can create campaigns" 
ON public.campaigns 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can update campaigns" 
ON public.campaigns 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can delete campaigns" 
ON public.campaigns 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);