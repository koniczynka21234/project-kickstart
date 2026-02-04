-- Insert system roles if they don't exist
INSERT INTO public.custom_roles (name, description, is_system)
VALUES 
  ('szef', 'Pełny dostęp do wszystkich funkcji systemu', true),
  ('pracownik', 'Podstawowy dostęp do funkcji operacyjnych', true)
ON CONFLICT (name) DO UPDATE SET is_system = true, description = EXCLUDED.description;

-- Add unique constraint on name if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_roles_name_key'
  ) THEN
    ALTER TABLE public.custom_roles ADD CONSTRAINT custom_roles_name_key UNIQUE (name);
  END IF;
END $$;

-- Clear existing permissions for system roles to reset them
DELETE FROM public.role_permissions 
WHERE role_id IN (SELECT id FROM public.custom_roles WHERE name IN ('szef', 'pracownik'));

-- Add all permissions to 'szef' role
INSERT INTO public.role_permissions (role_id, permission)
SELECT cr.id, p.permission
FROM public.custom_roles cr
CROSS JOIN (
  VALUES 
    ('leads_view'::app_permission), ('leads_create'::app_permission), ('leads_edit'::app_permission), ('leads_delete'::app_permission),
    ('clients_view'::app_permission), ('clients_create'::app_permission), ('clients_edit'::app_permission), ('clients_delete'::app_permission),
    ('campaigns_view'::app_permission), ('campaigns_create'::app_permission), ('campaigns_edit'::app_permission), ('campaigns_delete'::app_permission),
    ('documents_view'::app_permission), ('documents_create'::app_permission), ('documents_edit'::app_permission), ('documents_delete'::app_permission),
    ('tasks_view'::app_permission), ('tasks_create'::app_permission), ('tasks_edit'::app_permission), ('tasks_delete'::app_permission),
    ('reports_generate'::app_permission), ('invoices_generate'::app_permission), ('contracts_generate'::app_permission), ('presentations_generate'::app_permission),
    ('team_manage'::app_permission), ('roles_manage'::app_permission),
    ('calendar_view'::app_permission), ('calendar_manage'::app_permission),
    ('templates_manage'::app_permission)
) AS p(permission)
WHERE cr.name = 'szef';

-- Add basic permissions to 'pracownik' role
INSERT INTO public.role_permissions (role_id, permission)
SELECT cr.id, p.permission
FROM public.custom_roles cr
CROSS JOIN (
  VALUES 
    ('leads_view'::app_permission), ('leads_create'::app_permission), ('leads_edit'::app_permission),
    ('clients_view'::app_permission), ('clients_create'::app_permission), ('clients_edit'::app_permission),
    ('campaigns_view'::app_permission), ('campaigns_create'::app_permission), ('campaigns_edit'::app_permission),
    ('documents_view'::app_permission), ('documents_create'::app_permission), ('documents_edit'::app_permission),
    ('tasks_view'::app_permission), ('tasks_create'::app_permission), ('tasks_edit'::app_permission),
    ('reports_generate'::app_permission), ('invoices_generate'::app_permission), ('contracts_generate'::app_permission), ('presentations_generate'::app_permission),
    ('calendar_view'::app_permission), ('calendar_manage'::app_permission),
    ('templates_manage'::app_permission)
) AS p(permission)
WHERE cr.name = 'pracownik';