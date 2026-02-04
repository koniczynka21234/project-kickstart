-- Create permissions enum
CREATE TYPE public.app_permission AS ENUM (
  'leads_view',
  'leads_create',
  'leads_edit',
  'leads_delete',
  'clients_view',
  'clients_create',
  'clients_edit',
  'clients_delete',
  'campaigns_view',
  'campaigns_create',
  'campaigns_edit',
  'campaigns_delete',
  'documents_view',
  'documents_create',
  'documents_edit',
  'documents_delete',
  'tasks_view',
  'tasks_create',
  'tasks_edit',
  'tasks_delete',
  'reports_generate',
  'invoices_generate',
  'contracts_generate',
  'presentations_generate',
  'team_manage',
  'roles_manage'
);

-- Create custom_roles table
CREATE TABLE public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_roles
CREATE POLICY "Authenticated users can view custom roles"
ON public.custom_roles FOR SELECT
USING (true);

CREATE POLICY "Only szef can manage custom roles"
ON public.custom_roles FOR ALL
USING (is_szef(auth.uid()));

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission app_permission NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission)
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for role_permissions
CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions FOR SELECT
USING (true);

CREATE POLICY "Only szef can manage role permissions"
ON public.role_permissions FOR ALL
USING (is_szef(auth.uid()));

-- Add custom_role_id to user_roles table
ALTER TABLE public.user_roles ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id) ON DELETE SET NULL;

-- Insert default system roles
INSERT INTO public.custom_roles (name, description, is_system) VALUES
('Szef', 'Pełny dostęp do wszystkich funkcji systemu', true),
('Pracownik', 'Standardowy dostęp pracownika', true);

-- Get role IDs for default permissions
DO $$
DECLARE
  szef_role_id UUID;
  pracownik_role_id UUID;
BEGIN
  SELECT id INTO szef_role_id FROM public.custom_roles WHERE name = 'Szef';
  SELECT id INTO pracownik_role_id FROM public.custom_roles WHERE name = 'Pracownik';
  
  -- Szef gets all permissions
  INSERT INTO public.role_permissions (role_id, permission)
  SELECT szef_role_id, unnest(enum_range(NULL::app_permission));
  
  -- Pracownik gets basic permissions
  INSERT INTO public.role_permissions (role_id, permission) VALUES
  (pracownik_role_id, 'leads_view'),
  (pracownik_role_id, 'leads_create'),
  (pracownik_role_id, 'leads_edit'),
  (pracownik_role_id, 'clients_view'),
  (pracownik_role_id, 'clients_create'),
  (pracownik_role_id, 'clients_edit'),
  (pracownik_role_id, 'campaigns_view'),
  (pracownik_role_id, 'documents_view'),
  (pracownik_role_id, 'documents_create'),
  (pracownik_role_id, 'tasks_view'),
  (pracownik_role_id, 'tasks_create'),
  (pracownik_role_id, 'tasks_edit'),
  (pracownik_role_id, 'reports_generate'),
  (pracownik_role_id, 'invoices_generate'),
  (pracownik_role_id, 'contracts_generate'),
  (pracownik_role_id, 'presentations_generate');
END $$;

-- Create function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission app_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.custom_roles cr ON (
      cr.name = ur.role::text OR ur.custom_role_id = cr.id
    )
    JOIN public.role_permissions rp ON rp.role_id = cr.id
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
  OR is_szef(_user_id)  -- szef always has all permissions
$$;