-- Make RLS policy setup idempotent to avoid "already exists" errors
-- Authenticated
drop policy if exists conversation_scripts_select_authenticated on public.conversation_scripts;
drop policy if exists conversation_scripts_insert_authenticated on public.conversation_scripts;
drop policy if exists conversation_scripts_update_authenticated on public.conversation_scripts;
drop policy if exists conversation_scripts_delete_authenticated on public.conversation_scripts;

create policy conversation_scripts_select_authenticated
  on public.conversation_scripts
  for select
  to authenticated
  using (true);

create policy conversation_scripts_insert_authenticated
  on public.conversation_scripts
  for insert
  to authenticated
  with check (true);

create policy conversation_scripts_update_authenticated
  on public.conversation_scripts
  for update
  to authenticated
  using (true)
  with check (true);

create policy conversation_scripts_delete_authenticated
  on public.conversation_scripts
  for delete
  to authenticated
  using (true);

-- Anonymous (optional)
drop policy if exists conversation_scripts_select_anon on public.conversation_scripts;
drop policy if exists conversation_scripts_insert_anon on public.conversation_scripts;
drop policy if exists conversation_scripts_update_anon on public.conversation_scripts;
drop policy if exists conversation_scripts_delete_anon on public.conversation_scripts;

create policy conversation_scripts_select_anon
  on public.conversation_scripts
  for select
  to anon
  using (true);

create policy conversation_scripts_insert_anon
  on public.conversation_scripts
  for insert
  to anon
  with check (true);

create policy conversation_scripts_update_anon
  on public.conversation_scripts
  for update
  to anon
  using (true)
  with check (true);

create policy conversation_scripts_delete_anon
  on public.conversation_scripts
  for delete
  to anon
  using (true);
