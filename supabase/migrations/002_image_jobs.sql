begin;
create table public.image_jobs(id uuid primary key default gen_random_uuid(),owner uuid not null references public.users,kind text not null default 'clean_background' check(kind='clean_background'),status text not null default 'processing' check(status in ('processing','succeeded','failed')),original_path text,processed_path text,created_at timestamptz not null default now());
alter table public.image_jobs enable row level security;
create policy own_image_jobs on image_jobs for select to authenticated using(owner=auth.uid());
revoke all on image_jobs from anon,authenticated;grant select on image_jobs to authenticated;
create function public.reserve_image_job() returns uuid language plpgsql security definer set search_path=public as $$declare result uuid;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if (select count(*) from image_jobs where owner=auth.uid() and created_at>now()-interval '15 minutes')>=5 or (select count(*) from image_jobs where owner=auth.uid() and created_at>now()-interval '24 hours')>=20 then raise exception 'Processing limit reached';end if;
 insert into image_jobs(owner) values(auth.uid()) returning id into result;return result;end$$;
create function public.finish_image_job(p_job uuid,p_status text,p_original text,p_processed text) returns void language plpgsql security definer set search_path=public as $$declare record image_jobs;begin
 select * into record from image_jobs where id=p_job and owner=auth.uid() for update;if record.id is null or record.status<>'processing' or p_status not in ('succeeded','failed') or p_status is null then raise exception 'Invalid job transition';end if;
 if p_status='succeeded' then
 if p_original is null or p_processed is null or split_part(p_original,'/',1)<>auth.uid()::text or split_part(p_processed,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='private-designs' and name=p_original) or not exists(select 1 from storage.objects where bucket_id='private-designs' and name=p_processed) then raise exception 'Invalid private result';end if;
 end if;
 update image_jobs set status=p_status,original_path=case when p_status='succeeded' then p_original end,processed_path=case when p_status='succeeded' then p_processed end where id=record.id;
end$$;
revoke execute on function reserve_image_job(),finish_image_job(uuid,text,text,text) from public,anon;
grant execute on function reserve_image_job(),finish_image_job(uuid,text,text,text) to authenticated;
commit;
