-- Create private bucket for client documents used by Aurine Academy
insert into storage.buckets (id, name, public)
values ('client_documents', 'client_documents', false)
on conflict (id) do nothing;

-- RLS policies for team access (based on presence in public.user_roles)
create policy "client_documents_team_select"
on storage.objects for select
using (
  bucket_id = 'client_documents'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
  )
);

create policy "client_documents_team_insert"
on storage.objects for insert
with check (
  bucket_id = 'client_documents'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
  )
);

create policy "client_documents_team_update"
on storage.objects for update
using (
  bucket_id = 'client_documents'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'client_documents'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
  )
);

create policy "client_documents_team_delete"
on storage.objects for delete
using (
  bucket_id = 'client_documents'
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
  )
);