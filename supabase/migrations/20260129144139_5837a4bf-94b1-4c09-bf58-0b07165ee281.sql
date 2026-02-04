-- Remove the automatic role assignment trigger
-- New users should NOT automatically get access - szef must manually assign roles

DROP TRIGGER IF EXISTS on_auth_user_created_add_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();