-- Create role enum
CREATE TYPE public.app_role AS ENUM ('szef', 'pracownik');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is szef
CREATE OR REPLACE FUNCTION public.is_szef(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'szef'
  )
$$;

-- RLS policies for user_roles
-- Everyone can view roles (needed for UI)
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only szef can insert roles
CREATE POLICY "Szef can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_szef(auth.uid()));

-- Only szef can update roles
CREATE POLICY "Szef can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_szef(auth.uid()));

-- Only szef can delete roles
CREATE POLICY "Szef can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_szef(auth.uid()));

-- Update documents RLS policies for role-based access
-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can create documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

-- Szef can view all documents, others can view their own
CREATE POLICY "Users can view own documents or szef views all"
ON public.documents
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR public.is_szef(auth.uid())
);

-- Users can create their own documents
CREATE POLICY "Users can create own documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Users can update their own documents, szef can update all
CREATE POLICY "Users can update own documents or szef updates all"
ON public.documents
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR public.is_szef(auth.uid())
);

-- Users can delete their own documents, szef can delete all
CREATE POLICY "Users can delete own documents or szef deletes all"
ON public.documents
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR public.is_szef(auth.uid())
);