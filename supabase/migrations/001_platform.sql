begin;
revoke create on schema public from public,anon,authenticated;
create table public.users(id uuid primary key references auth.users on delete cascade, role text not null default 'bride' check(role in ('bride','designer','admin')), name text not null default '' check(length(name)<=120));
create table public.designer_profiles(id uuid primary key references public.users, name text not null, bio text not null default '', approved boolean not null default false);
create table public.garment_templates(id text primary key,name text not null,asset text not null,parts text[] not null,enabled boolean not null default false);
create table public.garment_components(id text primary key,template_id text references public.garment_templates,name text not null);
create table public.materials(id text primary key,name text not null,price_per_m numeric(10,2) check(price_per_m>=0),available boolean not null default true,description text not null default '');
create table public.designs(id uuid primary key default gen_random_uuid(),owner uuid not null references public.users,name text not null check(length(name) between 1 and 120),created_at timestamptz not null default now());
create table public.design_versions(id uuid primary key default gen_random_uuid(),design_id uuid not null references public.designs,config jsonb not null,board jsonb not null default '{}',created_at timestamptz not null default now());
create table public.measurements(id uuid primary key default gen_random_uuid(),owner uuid not null references public.users,values_cm jsonb not null,fitting_requested boolean not null default true,created_at timestamptz not null default now());
create table public.quotes(id uuid primary key default gen_random_uuid(),design_id uuid not null references public.designs,version_id uuid not null references public.design_versions,bride uuid not null references public.users,designer uuid not null references public.users,measurement_id uuid references public.measurements,status text not null default 'requested' check(status in ('requested','quoted','approved')),items jsonb,amount numeric(10,2) check(amount>0),created_at timestamptz not null default now());
create table public.orders(id uuid primary key default gen_random_uuid(),quote_id uuid not null unique references public.quotes,bride uuid not null references public.users,designer uuid not null references public.users,status text not null default 'design_approved' check(status in ('design_approved','sewing','fitting','completed')),payment_status text not null default 'not_configured' check(payment_status='not_configured'),created_at timestamptz not null default now());
create table public.order_events(id uuid primary key default gen_random_uuid(),order_id uuid references public.orders,quote_id uuid references public.quotes,actor uuid not null references public.users,event text not null,created_at timestamptz not null default now());
create table public.transformations(id uuid primary key default gen_random_uuid(),design_id uuid not null references public.designs,original_version uuid not null references public.design_versions,proposed_version uuid not null references public.design_versions,status text not null default 'pending_tailor' check(status in ('pending_tailor','approved','rejected')),reviewer uuid references public.users,review_notes text);
create table public.notifications(id uuid primary key default gen_random_uuid(),recipient uuid not null references public.users,message text not null,created_at timestamptz not null default now());
create table public.uploaded_assets(id uuid primary key default gen_random_uuid(),owner uuid not null references public.users,path text not null unique);

create function public.current_role() returns text language sql stable security definer set search_path=public as $$select role from users where id=auth.uid()$$;
create function public.can_read_design(d uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from designs where id=d and owner=auth.uid()) or exists(select 1 from quotes where design_id=d and designer=auth.uid()) or public.current_role()='admin'$$;
create function public.new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into users(id,name) values(new.id,left(coalesce(new.raw_user_meta_data->>'name',''),120));return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.new_user();

alter table public.users enable row level security;
alter table public.designer_profiles enable row level security;
alter table public.garment_templates enable row level security;
alter table public.garment_components enable row level security;
alter table public.materials enable row level security;
alter table public.designs enable row level security;
alter table public.design_versions enable row level security;
alter table public.measurements enable row level security;
alter table public.quotes enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.transformations enable row level security;
alter table public.notifications enable row level security;
alter table public.uploaded_assets enable row level security;
create policy own_user on users for select to authenticated using(id=auth.uid() or public.current_role()='admin');
create policy profiles on designer_profiles for select using(approved or id=auth.uid() or public.current_role()='admin');
create policy templates on garment_templates for select using(true);
create policy components on garment_components for select using(true);
create policy materials on materials for select using(true);
create policy designs on designs for select to authenticated using(can_read_design(id));
create policy versions on design_versions for select to authenticated using(can_read_design(design_id));
create policy measurements on measurements for select to authenticated using(owner=auth.uid() or exists(select 1 from quotes q where q.measurement_id=measurements.id and q.designer=auth.uid()));
create policy quotes on quotes for select to authenticated using(bride=auth.uid() or designer=auth.uid() or public.current_role()='admin');
create policy orders on orders for select to authenticated using(bride=auth.uid() or designer=auth.uid() or public.current_role()='admin');
create policy events on order_events for select to authenticated using(exists(select 1 from quotes q where q.id=order_events.quote_id and (q.bride=auth.uid() or q.designer=auth.uid())) or public.current_role()='admin');
create policy transformations on transformations for select to authenticated using(can_read_design(design_id));
create policy notifications on notifications for select to authenticated using(recipient=auth.uid());
create policy assets on uploaded_assets for select to authenticated using(owner=auth.uid());
revoke all on all tables in schema public from anon,authenticated;
grant select on users,designer_profiles,garment_templates,garment_components,materials,designs,design_versions,measurements,quotes,orders,order_events,transformations,notifications,uploaded_assets to authenticated;
grant select on designer_profiles,garment_templates,garment_components,materials to anon;

create function public.validate_config(c jsonb) returns void language plpgsql security definer set search_path=public as $$declare t garment_templates;begin
 select * into t from garment_templates where id=c->>'template';
 if t.id is null or not exists(select 1 from materials where id=c->>'material' and available) or (c->>'colour') !~ '^#[0-9a-fA-F]{6}$' or c->>'colour' is null then raise exception 'Invalid garment configuration';end if;
 if jsonb_typeof(c->'sleeves')<>'boolean' or jsonb_typeof(c->'train')<>'boolean' or jsonb_typeof(c->'overskirt')<>'boolean' or not(c ?& array['sleeves','train','overskirt']) then raise exception 'Missing component settings';end if;
 if (c->>'sleeves')::boolean and not('Sleeves'=any(t.parts)) or (c->>'train')::boolean and not('Train'=any(t.parts)) or (c->>'overskirt')::boolean and not('Overskirt'=any(t.parts)) then raise exception 'Unsupported garment component';end if;
end$$;
create function public.validate_board(b jsonb) returns void language plpgsql security definer set search_path=public as $$declare i jsonb;l jsonb;v jsonb;begin
 if b is null or jsonb_typeof(b)<>'object' or not(b ?& array['notes','images','lines']) or jsonb_typeof(b->'notes')<>'string' or length(b->>'notes')>5000 or jsonb_typeof(b->'images')<>'array' or jsonb_typeof(b->'lines')<>'array' then raise exception 'Invalid moodboard';end if;
 if jsonb_array_length(b->'images')>20 or jsonb_array_length(b->'lines')>200 then raise exception 'Moodboard has too many elements';end if;
 for i in select * from jsonb_array_elements(b->'images') loop
 if jsonb_typeof(i)<>'object' or not(i ?& array['src','x','y']) or jsonb_typeof(i->'src')<>'string' or (i->>'src') !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' or jsonb_typeof(i->'x')<>'number' or jsonb_typeof(i->'y')<>'number' then raise exception 'Invalid reference image';end if;
 if (i->>'x')::numeric not between 0 and 100 or (i->>'y')::numeric not between 0 and 100 then raise exception 'Invalid image position';end if;end loop;
 for l in select * from jsonb_array_elements(b->'lines') loop if jsonb_typeof(l)<>'array' then raise exception 'Invalid annotation';end if;if jsonb_array_length(l)>2000 or jsonb_array_length(l)%2<>0 then raise exception 'Invalid annotation size';end if;
 for v in select * from jsonb_array_elements(l) loop if jsonb_typeof(v)<>'number' then raise exception 'Invalid annotation point';end if;if (v::text)::numeric not between 0 and 100 then raise exception 'Invalid annotation point';end if;end loop;end loop;end$$;

create function public.save_design(p_name text,p_config jsonb,p_board jsonb,p_design uuid default null) returns uuid language plpgsql security definer set search_path=public as $$declare d uuid;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;perform validate_config(p_config);perform validate_board(p_board);
 if p_name is null or length(p_name) not between 1 and 120 or jsonb_typeof(p_board)<>'object' or p_board is null or octet_length(p_board::text)>3000000 then raise exception 'Invalid design name or oversized moodboard';end if;
 if p_design is null then insert into designs(owner,name) values(auth.uid(),p_name) returning id into d;else select id into d from designs where id=p_design and owner=auth.uid() for update;if d is null then raise exception 'Not authorised';end if;update designs set name=p_name where id=d;end if;
 insert into design_versions(design_id,config,board) values(d,p_config,p_board);return d;end$$;
create function public.save_measurements(p_values jsonb,p_fitting boolean) returns uuid language plpgsql security definer set search_path=public as $$declare k text;v jsonb;r uuid;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if p_values is null or jsonb_typeof(p_values)<>'object' or not(p_values ?& array['bust','waist','hips','height']) then raise exception 'Required measurements missing';end if;
 for k,v in select * from jsonb_each(p_values) loop if k not in ('bust','waist','hips','height') or jsonb_typeof(v)<>'number' or (v::text)::numeric not between 30 and 250 then raise exception 'Invalid measurement';end if;end loop;
 insert into measurements(owner,values_cm,fitting_requested) values(auth.uid(),p_values,p_fitting) returning id into r;return r;end$$;
create function public.request_quote(p_version uuid,p_designer uuid,p_measurement uuid default null) returns uuid language plpgsql security definer set search_path=public as $$declare d uuid;q uuid;begin
 select v.design_id into d from design_versions v join designs ds on ds.id=v.design_id where v.id=p_version and ds.owner=auth.uid();if d is null then raise exception 'Not authorised';end if;
 if not exists(select 1 from design_versions v join garment_templates t on t.id=v.config->>'template' where v.id=p_version and t.enabled) then raise exception 'Garment asset not approved for production';end if;
 if not exists(select 1 from designer_profiles p join users u on u.id=p.id where p.id=p_designer and p.approved and u.role='designer') then raise exception 'Designer not approved';end if;
 if p_measurement is not null and not exists(select 1 from measurements where id=p_measurement and owner=auth.uid()) then raise exception 'Measurement access denied';end if;
 insert into quotes(design_id,version_id,bride,designer,measurement_id) values(d,p_version,auth.uid(),p_designer,p_measurement) returning id into q;
 insert into order_events(quote_id,actor,event) values(q,auth.uid(),'quote_requested');insert into notifications(recipient,message) values(p_designer,'A new design brief is ready for your review.');return q;end$$;
create function public.provide_quote(p_quote uuid,p_items jsonb) returns void language plpgsql security definer set search_path=public as $$declare q quotes;item jsonb;total numeric:=0;begin
 select * into q from quotes where id=p_quote for update;if q.designer is distinct from auth.uid() or public.current_role() is distinct from 'designer' or q.id is null or q.status<>'requested' then raise exception 'Not authorised or quote already issued';end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Invalid line items';end if;
 for item in select * from jsonb_array_elements(p_items) loop if length(item->>'label') not between 1 and 120 or item->>'label' is null or jsonb_typeof(item->'amount')<>'number' or item->'amount' is null or (item->>'amount')::numeric not between 0.01 and 100000 then raise exception 'Invalid line item';end if;total:=total+(item->>'amount')::numeric;end loop;
 update quotes set items=p_items,amount=total,status='quoted' where id=q.id;insert into order_events(quote_id,actor,event) values(q.id,auth.uid(),'quote_issued');insert into notifications(recipient,message) values(q.bride,'Your itemised quote is ready to review.');end$$;
create function public.approve_quote(p_quote uuid) returns uuid language plpgsql security definer set search_path=public as $$declare q quotes;o uuid;begin
 select * into q from quotes where id=p_quote for update;if q.id is null or q.bride is distinct from auth.uid() or q.status<>'quoted' then raise exception 'Not authorised or quote not ready';end if;
 update quotes set status='approved' where id=q.id;insert into orders(quote_id,bride,designer) values(q.id,q.bride,q.designer) returning id into o;
 insert into order_events(order_id,quote_id,actor,event) values(o,q.id,auth.uid(),'design_approved_payment_not_configured');insert into notifications(recipient,message) values(q.designer,'The customer approved the quote. Payment remains unconfigured.');return o;end$$;
create function public.advance_order(p_order uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$declare o orders;begin
 select * into o from orders where id=p_order for update;if o.id is null or (o.designer is distinct from auth.uid() and public.current_role() is distinct from 'admin') then raise exception 'Not authorised';end if;
 if not((o.status='design_approved' and p_status='sewing') or (o.status='sewing' and p_status='fitting') or (o.status='fitting' and p_status='completed')) then raise exception 'Invalid production transition';end if;
 update orders set status=p_status where id=o.id;insert into order_events(order_id,quote_id,actor,event) values(o.id,o.quote_id,auth.uid(),p_status);insert into notifications(recipient,message) values(o.bride,'Production update: '||p_status);end$$;
create function public.plan_transformation(p_original uuid,p_config jsonb) returns uuid language plpgsql security definer set search_path=public as $$declare v design_versions;n uuid;r uuid;begin
 select dv.* into v from design_versions dv join designs d on d.id=dv.design_id where dv.id=p_original and d.owner=auth.uid();if v.id is null then raise exception 'Not authorised';end if;perform validate_config(p_config);if not exists(select 1 from garment_templates where id=v.config->>'template' and enabled) then raise exception 'Garment asset not approved for transformation';end if;
 if v.config->>'template'<>p_config->>'template' or v.config->>'material'<>p_config->>'material' or v.config->>'colour'<>p_config->>'colour' or v.config->>'sleeves'<>p_config->>'sleeves' or ((p_config->>'train')::boolean and not(v.config->>'train')::boolean) or ((p_config->>'overskirt')::boolean and not(v.config->>'overskirt')::boolean) or (p_config->>'train'=v.config->>'train' and p_config->>'overskirt'=v.config->>'overskirt') then raise exception 'Only removal of supported detachable train or overskirt is allowed';end if;
 insert into design_versions(design_id,config,board) values(v.design_id,p_config,v.board) returning id into n;insert into transformations(design_id,original_version,proposed_version) values(v.design_id,v.id,n) returning id into r;return r;end$$;
create function public.review_transformation(p_id uuid,p_approve boolean,p_notes text) returns void language plpgsql security definer set search_path=public as $$declare tr transformations;begin
 select * into tr from transformations where id=p_id for update;if tr.id is null or public.current_role() is distinct from 'designer' or not exists(select 1 from quotes where design_id=tr.design_id and designer=auth.uid()) or tr.status<>'pending_tailor' then raise exception 'Not authorised';end if;
 if p_notes is null or length(p_notes) not between 1 and 2000 then raise exception 'Review notes required';end if;
 update transformations set status=case when p_approve then 'approved' else 'rejected' end,reviewer=auth.uid(),review_notes=p_notes where id=tr.id;insert into notifications(recipient,message) select owner,'Transformation review: '||case when p_approve then 'approved' else 'rejected' end from designs where id=tr.design_id;end$$;
create function public.admin_role(p_user uuid,p_role text) returns void language plpgsql security definer set search_path=public as $$begin
 if public.current_role() is distinct from 'admin' or p_role is null or p_role not in ('bride','designer','admin') or p_user=auth.uid() then raise exception 'Not authorised';end if;
 update users set role=p_role where id=p_user;if p_role='designer' then insert into designer_profiles(id,name,approved) select id,name,true from users where id=p_user on conflict(id) do update set approved=true;else update designer_profiles set approved=false where id=p_user;end if;end$$;
create function public.admin_material(p_id text,p_name text,p_price numeric,p_available boolean) returns void language plpgsql security definer set search_path=public as $$begin
 if public.current_role() is distinct from 'admin' or p_name is null or p_price is null or p_available is null or length(p_name) not between 1 and 120 or p_price not between 0 and 10000 then raise exception 'Not authorised or invalid material';end if;update materials set name=p_name,price_per_m=p_price,available=p_available where id=p_id;end$$;


create table public.audit_events(id uuid primary key default gen_random_uuid(),actor uuid references public.users,entity text not null,record_id text,action text not null,previous_state text,new_state text,created_at timestamptz not null default now());
alter table public.audit_events enable row level security;
create policy audit_read on audit_events for select to authenticated using(actor=auth.uid() or public.current_role()='admin');
revoke all on audit_events from anon,authenticated;grant select on audit_events to authenticated;
create function public.audit_change() returns trigger language plpgsql security definer set search_path=public as $$begin
 insert into audit_events(actor,entity,record_id,action,previous_state,new_state) values(auth.uid(),TG_TABLE_NAME,to_jsonb(NEW)->>'id',TG_OP,case when TG_OP='UPDATE' then coalesce(to_jsonb(OLD)->>'status',to_jsonb(OLD)->>'role') else null end,coalesce(to_jsonb(NEW)->>'status',to_jsonb(NEW)->>'role'));return NEW;end$$;
create trigger audit_quotes after insert or update on quotes for each row execute function audit_change();
create trigger audit_orders after insert or update on orders for each row execute function audit_change();
create trigger audit_transformations after insert or update on transformations for each row execute function audit_change();
create trigger audit_roles after update on users for each row execute function audit_change();
create trigger audit_materials after update on materials for each row execute function audit_change();
create trigger audit_templates after update on garment_templates for each row execute function audit_change();


create function public.update_designer_profile(p_name text,p_bio text) returns void language plpgsql security definer set search_path=public as $$begin
 if auth.uid() is null or p_name is null or length(p_name) not between 1 and 120 or p_bio is null or length(p_bio)>3000 then raise exception 'Invalid profile';end if;
 insert into designer_profiles(id,name,bio,approved) values(auth.uid(),p_name,p_bio,false) on conflict(id) do update set name=excluded.name,bio=excluded.bio;end$$;
create function public.admin_template(p_id text,p_enabled boolean) returns void language plpgsql security definer set search_path=public as $$begin
 if public.current_role() is distinct from 'admin' or p_enabled is null then raise exception 'Not authorised';end if;
 update garment_templates set enabled=p_enabled where id=p_id;if not found then raise exception 'Unknown template';end if;end$$;

create function public.register_asset(p_path text) returns uuid language plpgsql security definer set search_path=public as $$declare id uuid;begin
 if auth.uid() is null or p_path is null or split_part(p_path,'/',1)<>auth.uid()::text or length(p_path)>250 or not exists(select 1 from storage.objects where bucket_id='private-designs' and name=p_path) then raise exception 'Invalid private asset';end if;
 insert into uploaded_assets(owner,path) values(auth.uid(),p_path) returning uploaded_assets.id into id;return id;end$$;

revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.current_role() to anon,authenticated;
grant execute on function can_read_design(uuid) to authenticated;
grant execute on function register_asset(text) to authenticated;
grant execute on function update_designer_profile(text,text),admin_template(text,boolean) to authenticated;
grant execute on function save_design(text,jsonb,jsonb,uuid),save_measurements(jsonb,boolean),request_quote(uuid,uuid,uuid),provide_quote(uuid,jsonb),approve_quote(uuid),advance_order(uuid,text),plan_transformation(uuid,jsonb),review_transformation(uuid,boolean,text),admin_role(uuid,text),admin_material(text,text,numeric,boolean) to authenticated;
insert into garment_templates values('aurelia','Aurelia','/models/aurelia.glb',array['Sleeves','Train','Overskirt'],false),('celeste','Celeste','/models/celeste.glb',array['Sleeves','Train'],false),('rosalie','Rosalie','/models/rosalie.glb',array['Train','Overskirt'],false);
insert into garment_components select id||'-'||lower(p),id,p from garment_templates,unnest(parts) p;
insert into materials(id,name,price_per_m,description) values('satin','Ivory satin',32,'Sample catalogue'),('lace','Floral lace',48,'Sample catalogue'),('tulle','Soft tulle',18,'Sample catalogue'),('organza','Silk organza',40,'Sample catalogue');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('private-designs','private-designs',false,2097152,array['image/png','image/jpeg','image/webp']);
create policy private_assets_read on storage.objects for select to authenticated using(bucket_id='private-designs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy private_assets_insert on storage.objects for insert to authenticated with check(bucket_id='private-designs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy private_assets_delete on storage.objects for delete to authenticated using(bucket_id='private-designs' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
