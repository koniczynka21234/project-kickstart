-- Update RLS policies for payments to allow all team members to view (but only szef can manage)
DROP POLICY IF EXISTS "Only szef can view payments" ON public.payments;

CREATE POLICY "Team members can view payments" 
ON public.payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid()
));