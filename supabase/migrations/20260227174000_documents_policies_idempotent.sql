drop policy if exists documents_select_authenticated on public.documents;
drop policy if exists documents_insert_authenticated on public.documents;
drop policy if exists documents_update_authenticated on public.documents;
drop policy if exists documents_delete_authenticated on public.documents;

create policy documents_select_authenticated
  on public.documents
  for select
  to authenticated
  using (true);

create policy documents_insert_authenticated
  on public.documents
  for insert
  to authenticated
  with check (true);

create policy documents_update_authenticated
  on public.documents
  for update
  to authenticated
  using (true)
  with check (true);

create policy documents_delete_authenticated
  on public.documents
  for delete
  to authenticated
  using (true);

drop policy if exists documents_select_anon on public.documents;
drop policy if exists documents_insert_anon on public.documents;
drop policy if exists documents_update_anon on public.documents;
drop policy if exists documents_delete_anon on public.documents;

create policy documents_select_anon
  on public.documents
  for select
  to anon
  using (true);

create policy documents_insert_anon
  on public.documents
  for insert
  to anon
  with check (true);

create policy documents_update_anon
  on public.documents
  for update
  to anon
  using (true)
  with check (true);

create policy documents_delete_anon
  on public.documents
  for delete
  to anon
  using (true);
