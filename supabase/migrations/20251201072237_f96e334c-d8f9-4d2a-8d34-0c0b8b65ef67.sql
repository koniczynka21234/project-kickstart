-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own documents or szef views all" ON public.documents;

-- Create new policy: all authenticated users can view all documents
CREATE POLICY "Authenticated users can view all documents" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (true);