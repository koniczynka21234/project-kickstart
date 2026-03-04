alter table public.conversation_scripts
  add column if not exists guardian_id uuid null,
  add column if not exists guardian_name text null;
