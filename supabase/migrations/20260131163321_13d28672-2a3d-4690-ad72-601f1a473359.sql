-- Recreate the trigger on auth.users to ensure profiles are created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Manually create profile for existing user
INSERT INTO public.profiles (id, email, full_name)
VALUES (
  'b33d007f-40e0-4e14-8ddd-ad760d0f3dd5',
  'kontakt@aurine.pl',
  'Marcjanna'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Add szef role for this user
INSERT INTO public.user_roles (user_id, role)
VALUES ('b33d007f-40e0-4e14-8ddd-ad760d0f3dd5', 'szef')
ON CONFLICT (user_id, role) DO NOTHING;