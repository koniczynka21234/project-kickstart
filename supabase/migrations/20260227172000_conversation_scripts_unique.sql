-- Ensure one script per audit to avoid duplicates
create unique index if not exists conversation_scripts_audit_unique
on public.conversation_scripts(audit_id);
