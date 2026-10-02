-- Dubai Monthly Cars
-- Storage security hardening

update storage.buckets
set public = false
where id in ('agreements', 'condition-photos', 'damage-reports');

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%agreements%'
        or coalesce(with_check, '') ilike '%agreements%'
        or coalesce(qual, '') ilike '%condition-photos%'
        or coalesce(with_check, '') ilike '%condition-photos%'
        or coalesce(qual, '') ilike '%damage-reports%'
        or coalesce(with_check, '') ilike '%damage-reports%'
      )
  loop
    execute format(
      'drop policy if exists %I on storage.objects',
      p.policyname
    );
  end loop;
end $$;

create policy "Customers can upload own agreements"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'agreements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Customers can read own agreements"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'agreements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Staff can manage agreements"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'agreements'
  and public.is_staff()
)
with check (
  bucket_id = 'agreements'
  and public.is_staff()
);

create policy "Customers can upload own condition photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'condition-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Customers can read own condition photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'condition-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Staff can manage condition photos"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'condition-photos'
  and public.is_staff()
)
with check (
  bucket_id = 'condition-photos'
  and public.is_staff()
);

create policy "Customers can upload own damage reports"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'damage-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Customers can read own damage reports"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'damage-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Staff can manage damage reports"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'damage-reports'
  and public.is_staff()
)
with check (
  bucket_id = 'damage-reports'
  and public.is_staff()
);

drop policy if exists "Staff can insert activity logs"
on public.activity_logs;