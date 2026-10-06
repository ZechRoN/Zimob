-- Application services run entirely in Supabase. No external backend or service key.
create or replace function private.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users u, public.app_config c
 where u.id=auth.uid() and u.email_confirmed_at is not null and c.id='default'
 and lower(u.email)=any(select lower(e) from unnest(c.super_admin_emails) e));
$$;

create or replace function private.has_company_role(p_company_id uuid,p_roles text[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.company_user m join public.company c on c.id=m.company_id
 where m.company_id=p_company_id and m.user_id=auth.uid() and m.ativo
 and (p_roles is null or m.role::text=any(p_roles))
 and c.status::text in ('active','trial') and (c.status::text<>'trial' or c.trial_ate is null or c.trial_ate>=current_date));
$$;

-- Registration is one transaction via RPC, never separate client inserts.
drop trigger if exists validate_company_insert on public.company;
revoke insert on public.company from authenticated;
drop policy if exists company_user_insert_invited_or_owner on public.company_user;
create policy company_user_insert_invited_or_owner on public.company_user for insert to authenticated with check (
 private.is_super_admin() or (user_id is null and role::text<>'owner' and (
 private.has_company_role(company_id,array['owner']) or
 (role::text<>'admin' and private.has_company_role(company_id,array['admin'])))));

create or replace function private.protect_member_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.company_id is distinct from old.company_id then raise exception 'Não é possível transferir vínculo de imobiliária'; end if;
 if private.is_super_admin() then return new; end if;
 if new.user_id is distinct from old.user_id or lower(new.email) is distinct from lower(old.email) then
   if not (old.user_id is null and new.user_id=auth.uid() and new.email=old.email
     and new.role=old.role and new.ativo=old.ativo
     and exists(select 1 from auth.users u where u.id=auth.uid() and lower(u.email)=lower(old.email) and u.email_confirmed_at is not null)) then
     raise exception 'Identidade do membro não pode ser alterada';
   end if;
 end if;
 if new.role is distinct from old.role and not private.has_company_role(old.company_id,array['owner']) then
   raise exception 'Somente o titular altera permissões';
 end if;
 return new;
end $$;
create trigger protect_member_identity before update on public.company_user for each row execute function private.protect_member_identity();

-- Financial reads must be restricted as well as writes.
do $$ declare t text; begin
 foreach t in array array['commission','revenue','operational_cost'] loop
 execute format('drop policy if exists %I on public.%I',t||'_read_company',t);
 execute format('create policy %I on public.%I for select to authenticated using (private.is_super_admin() or private.has_company_role(company_id,array[''owner'',''admin'',''financeiro'']))',t||'_read_company',t);
 end loop;
end $$;

-- A foreign key alone does not prove that both records belong to the same tenant.
create or replace function private.validate_tenant_links()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r jsonb:=to_jsonb(new); field text; target text; linked uuid;
begin
 if TG_OP='UPDATE' and new.company_id is distinct from old.company_id then raise exception 'Não é possível transferir registros entre imobiliárias'; end if;
 foreach field in array array['property_id','interest_property_id','lead_id','corretor_id','assigned_to','captado_por','proposal_id'] loop
   if nullif(r->>field,'') is not null then
     target:=case when field in ('property_id','interest_property_id') then 'property' when field='lead_id' then 'lead' when field='proposal_id' then 'proposal' else 'company_user' end;
     execute format('select company_id from public.%I where id=$1',target) into linked using (r->>field)::uuid;
     if linked is distinct from new.company_id then raise exception 'O vínculo deve pertencer à mesma imobiliária'; end if;
   end if;
 end loop;
 if TG_TABLE_NAME in ('visit','proposal') then
   new.property_title:=(select title from public.property where id=(r->>'property_id')::uuid);
   if nullif(r->>'lead_id','') is not null then new.lead_name:=(select name from public.lead where id=(r->>'lead_id')::uuid); end if;
 end if;
 if TG_TABLE_NAME='commission' then
   new.corretor_nome:=(select nome from public.company_user where id=(r->>'corretor_id')::uuid);
 end if;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['property','lead','visit','proposal','commission','revenue','operational_cost','zone'] loop
 execute format('create trigger validate_tenant_links before insert or update on public.%I for each row execute function private.validate_tenant_links()',t);
 end loop;
end $$;

create or replace function public.zimob_bootstrap(input jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u auth.users; m public.company_user; c public.company; master boolean; selected uuid;
begin
 select * into u from auth.users where id=auth.uid();
 if u.id is null then raise exception 'Entre para continuar'; end if;
 if u.email_confirmed_at is null then raise exception 'Verifique seu email para continuar'; end if;
 master:=private.is_super_admin();
 -- Bind only one pending invitation, after verified email ownership. Never rebind existing membership.
 if not exists(select 1 from public.company_user where user_id=u.id) then
   select * into m from public.company_user where lower(email)=lower(u.email) and user_id is null and ativo order by created_at,id limit 1 for update;
   if m.id is not null then update public.company_user set user_id=u.id where id=m.id; end if;
 end if;
 if master then
   selected:=nullif(input->>'companyId','')::uuid;
   if selected is not null then
     select * into c from public.company where id=selected;
     if c.id is null then raise exception 'Imobiliária não encontrada'; end if;
   end if;
 else
   select * into m from public.company_user where user_id=u.id and ativo limit 1;
   select * into c from public.company where id=m.company_id;
 end if;
 return jsonb_build_object('configured',true,'isSuperAdmin',master,'company',case when c.id is null then null else to_jsonb(c) end,
 'companyUser',case when master and c.id is not null then jsonb_build_object('id','master','company_id',c.id,'role','owner','nome','Administrador','email',u.email,'ativo',true)
 when m.id is not null and not master then to_jsonb(m) else null end);
end $$;

create or replace function public.zimob_create_company(input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u auth.users; c public.company; master boolean; owner_mail text; company_slug text; existing_user uuid;
begin
 select * into u from auth.users where id=auth.uid();
 if u.id is null or u.email_confirmed_at is null then raise exception 'Verifique seu email antes de cadastrar'; end if;
 perform pg_advisory_xact_lock(hashtext(u.id::text));
 master:=private.is_super_admin();
 if not master and exists(select 1 from public.company_user where user_id=u.id or lower(email)=lower(u.email)) then raise exception 'Você já possui vínculo com uma imobiliária'; end if;
 if length(trim(coalesce(input->>'name',''))) not between 2 and 150 then raise exception 'Informe o nome da imobiliária'; end if;
 owner_mail:=case when master then lower(trim(coalesce(input->>'ownerEmail',input->>'owner_email',''))) else lower(u.email) end;
 if owner_mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Informe um email válido para o titular'; end if;
 if exists(select 1 from public.company_user where lower(email)=owner_mail) then raise exception 'O titular já possui uma imobiliária'; end if;
 company_slug:=coalesce(nullif(input->>'slug',''),trim(both '-' from regexp_replace(lower(input->>'name'),'[^a-z0-9]+','-','g'))||'-'||left(gen_random_uuid()::text,8));
 if company_slug !~ '^[a-z0-9][a-z0-9-]{1,99}$' then raise exception 'Endereço da vitrine inválido'; end if;
 select id into existing_user from auth.users where lower(email)=owner_mail and email_confirmed_at is not null;
 insert into public.company(name,slug,owner_email,owner_nome,owner_telefone,cnpj,creci,telefone,email,cor_primaria,plano,status,trial_ate,settings)
 values(trim(input->>'name'),company_slug,owner_mail,coalesce(input->>'ownerNome',input->>'owner_nome'),coalesce(input->>'ownerTelefone',input->>'owner_telefone'),input->>'cnpj',input->>'creci',input->>'telefone',input->>'email',coalesce(input->>'cor',input->>'cor_primaria','#0EA5E9'),
 case when master then coalesce(nullif(input->>'plano',''),'starter') else 'starter' end,'trial',current_date+14,
 jsonb_build_object('whatsapp',coalesce(input->>'whatsapp',''))) returning * into c;
 insert into public.company_user(company_id,email,nome,role,user_id) values(c.id,owner_mail,coalesce(input->>'ownerNome',input->>'owner_nome','Titular'),'owner',existing_user);
 return to_jsonb(c);
end $$;

-- Public API exposes only an allowlist of marketing fields. Private tables remain closed to anon.
create or replace function public.zimob_public_api(input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.company; p public.property; properties jsonb; company_data jsonb; property_data jsonb; action text:=input->>'action';
 pid uuid:=nullif(input->>'id','')::uuid; lead_id uuid; visit_id uuid; when_at timestamptz; day_at date;
 person text:=trim(input->>'name'); v_phone text:=regexp_replace(coalesce(input->>'phone',''),'[^0-9+]','','g'); email text:=nullif(trim(input->>'email'),'');
begin
 if length(coalesce(input->>'slug','')) not between 1 and 100 then raise exception 'Vitrine inválida'; end if;
 select * into c from public.company where slug=input->>'slug' and status::text in ('active','trial')
 and (status::text<>'trial' or trial_ate is null or trial_ate>=current_date);
 if c.id is null or c.settings->'public_showcase'->>'enabled'='false' then raise exception 'Imobiliária não encontrada'; end if;
 company_data:=jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug,'logo_url',c.logo_url,'telefone',c.telefone,'email',c.email,'creci',c.creci,'cor_primaria',c.cor_primaria,
 'settings',jsonb_build_object('vitrine_descricao',c.settings->'vitrine_descricao','whatsapp',c.settings->'whatsapp','depoimentos',coalesce(c.settings->'depoimentos','[]'::jsonb)));
 select coalesce(jsonb_agg(to_jsonb(pub)),'[]'::jsonb) into properties from (
 select id,company_id,title,description,price,type,transaction,status,area_total,area_useful,bedrooms,suites,bathrooms,parking,condo_fee,iptu,city,neighborhood,state,photos,features,video_url,slug,code,listed_at
 from public.property where company_id=c.id and status::text='disponivel' order by created_at desc limit 500) pub;
 if pid is not null then
   select * into p from public.property where id=pid and company_id=c.id and status::text='disponivel';
   if p.id is null then raise exception 'Imóvel não encontrado'; end if;
   select value into property_data from jsonb_array_elements(properties) where value->>'id'=pid::text;
 end if;
 if action='catalog' then return jsonb_build_object('company',company_data,'properties',properties,'property',property_data,
 'similar',(select coalesce(jsonb_agg(value),'[]'::jsonb) from (select value from jsonb_array_elements(properties) where pid is null or value->>'id'<>pid::text limit 3) s)); end if;
 if p.id is null then raise exception 'Imóvel obrigatório'; end if;
 if action='slots' then
   day_at:=(input->>'date')::date;
   if day_at is null then raise exception 'Data inválida'; end if;
   return jsonb_build_object('taken',(select coalesce(jsonb_agg(to_char(scheduled_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),'[]'::jsonb) from public.visit
   where property_id=pid and status::text<>'cancelada' and (scheduled_at at time zone 'America/Sao_Paulo')::date=day_at));
 end if;
 if action is null or action not in ('interest','book') then raise exception 'Ação inválida'; end if;
 if person is null or length(person) not between 2 and 120 or length(v_phone) not between 8 and 24
 or length(coalesce(input->>'message',''))>1000 or (email is not null and (length(email)>200 or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')) then raise exception 'Dados de contato inválidos'; end if;
 perform pg_advisory_xact_lock(hashtext(c.id::text||v_phone));
 if (select count(*) from public.lead where company_id=c.id and lead.phone=v_phone and created_at>now()-interval '1 hour')>=6 then raise exception 'Solicitações demais; fale diretamente com a imobiliária'; end if;
 if action='book' then
   when_at:=(input->>'scheduled_at')::timestamptz;
   if when_at is null or when_at<now() or when_at>now()+interval '180 days' or date_trunc('hour',when_at)<>when_at
   or extract(hour from when_at at time zone 'America/Sao_Paulo') not in (9,10,11,14,15,16,17,18) then raise exception 'Horário inválido'; end if;
 end if;
 insert into public.lead(company_id,name,phone,email,source,status,interest_property_id,notes)
 values(c.id,person,v_phone,email,'site',case when action='book' then 'visita_marcada' else 'novo' end,pid,input->>'message') returning id into lead_id;
 if action='book' then
   insert into public.visit(company_id,property_id,property_title,lead_id,lead_name,lead_phone,scheduled_at,status)
   values(c.id,pid,p.title,lead_id,person,v_phone,when_at,'agendada') returning id into visit_id;
   return jsonb_build_object('ok',true,'protocolo','VIS-'||upper(left(visit_id::text,8)));
 end if;
 return jsonb_build_object('ok',true);
exception when unique_violation then raise exception 'Este horário já foi reservado; escolha outro';
end $$;

-- Marketing images are public; object writes are restricted by company folder and role.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('logos','logos',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('property-photos','property-photos',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create or replace function private.can_manage_image(bucket text,path text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare cid uuid; begin
 if bucket not in ('logos','property-photos') or position('/' in path)=0 then return false; end if;
 begin cid:=split_part(path,'/',1)::uuid; exception when invalid_text_representation then return false; end;
 return private.is_super_admin() or private.has_company_role(cid,case when bucket='logos' then array['owner','admin'] else array['owner','admin','corretor','captador'] end);
end $$;
create policy zimob_image_read on storage.objects for select to authenticated using(private.can_manage_image(bucket_id,name));
create policy zimob_image_insert on storage.objects for insert to authenticated with check(private.can_manage_image(bucket_id,name));
create policy zimob_image_update on storage.objects for update to authenticated using(private.can_manage_image(bucket_id,name)) with check(private.can_manage_image(bucket_id,name));
create policy zimob_image_delete on storage.objects for delete to authenticated using(private.can_manage_image(bucket_id,name));

revoke all on function public.zimob_bootstrap(jsonb),public.zimob_create_company(jsonb),public.zimob_public_api(jsonb) from public,anon,authenticated;
grant execute on function public.zimob_bootstrap(jsonb),public.zimob_create_company(jsonb) to authenticated;
grant execute on function public.zimob_public_api(jsonb) to anon,authenticated;
revoke all on all functions in schema private from public,anon;
grant execute on function private.is_super_admin(),private.has_company_role(uuid,text[]),private.can_write_company(uuid,text[]),private.can_manage_image(text,text) to authenticated;
