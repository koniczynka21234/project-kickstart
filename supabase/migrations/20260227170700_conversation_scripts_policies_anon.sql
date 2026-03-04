-- Additional RLS policies to allow anon role (optional if app uses unauthenticated access)
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
