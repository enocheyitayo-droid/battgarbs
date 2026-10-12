begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('public-catalogue','public-catalogue',true,26214400,array['image/png','image/jpeg','image/webp','video/mp4','video/webm','model/gltf-binary','application/octet-stream']),
('private-atelier','private-atelier',false,10485760,array['image/png','image/jpeg','image/webp','application/pdf','model/gltf-binary','application/octet-stream'])
on conflict(id) do nothing;
create policy catalogue_read on storage.objects for select using(bucket_id='public-catalogue');
create policy catalogue_admin_insert on storage.objects for insert to authenticated with check(bucket_id='public-catalogue' and public.current_role()='admin');
create policy catalogue_admin_update on storage.objects for update to authenticated using(bucket_id='public-catalogue' and public.current_role()='admin') with check(bucket_id='public-catalogue' and public.current_role()='admin');
create policy catalogue_admin_delete on storage.objects for delete to authenticated using(bucket_id='public-catalogue' and public.current_role()='admin');
create policy atelier_owned_read on storage.objects for select to authenticated using(bucket_id='private-atelier' and (storage.foldername(name))[1]=auth.uid()::text);
create policy atelier_owned_insert on storage.objects for insert to authenticated with check(bucket_id='private-atelier' and (storage.foldername(name))[1]=auth.uid()::text);
create policy atelier_owned_delete on storage.objects for delete to authenticated using(bucket_id='private-atelier' and (storage.foldername(name))[1]=auth.uid()::text);
-- Keep private-designs intact: existing records and the image worker use it.
-- Migrate paths and policies explicitly before changing the active upload bucket.
commit;
