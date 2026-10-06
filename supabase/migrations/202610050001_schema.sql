-- Zimob / ImobFlow database for this Supabase project.
-- New-project setup only: this project was checked and public currently has no tables.
-- No records from the source template are imported. Apply once in the linked Supabase SQL editor.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.app_config (
  id text primary key default 'default',
  app_name text not null default 'ImobFlow AI',
  super_admin_emails text[] not null default '{}',
  system_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_config (id, app_name, super_admin_emails)
values ('default', 'ImobFlow AI', array['contato@zivello.com.br'])
on conflict (id) do update set
  super_admin_emails = array['contato@zivello.com.br'],
  updated_at = now();

create table if not exists public.company (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  cnpj text,
  creci text,
  telefone text,
  email text,
  endereco jsonb not null default '{}'::jsonb,
  cor_primaria text,
  logo_url text,
  owner_email text,
  owner_nome text,
  owner_telefone text,
  plano text not null default 'starter' check (plano in ('starter','pro','enterprise')),
  status text not null default 'trial' check (status in ('active','trial','blocked','canceled')),
  trial_ate date,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_user (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  email text not null,
  nome text,
  creci text,
  role text not null default 'corretor' check (role in ('owner','admin','corretor','captador','financeiro')),
  ativo boolean not null default true,
  comissao_pct numeric(5,2) not null default 50 check (comissao_pct between 0 and 100),
  must_change_password boolean not null default false,
  ultimo_login timestamptz,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists company_member_email
  on public.company_user(company_id,lower(email));
create unique index if not exists company_user_one_company_per_user
  on public.company_user(user_id) where user_id is not null;
create index if not exists idx_company_user_company_id on public.company_user(company_id);

create table if not exists public.property (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  title text not null,
  description text,
  price numeric(14,2) not null default 0 check (price >= 0),
  type text not null default 'apartamento' check (type in ('casa','apartamento','terreno','comercial','rural')),
  transaction text not null default 'venda' check (transaction in ('venda','aluguel','temporada')),
  status text not null default 'disponivel' check (status in ('disponivel','reservado','vendido','alugado','inativo')),
  address jsonb not null default '{}'::jsonb,
  city text,
  neighborhood text,
  state text,
  zip_code text,
  area_total numeric(10,2) check (area_total is null or area_total >= 0),
  area_useful numeric(10,2) check (area_useful is null or area_useful >= 0),
  bedrooms integer not null default 0 check (bedrooms >= 0),
  suites integer not null default 0 check (suites >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  parking integer not null default 0 check (parking >= 0),
  condo_fee numeric(14,2) check (condo_fee is null or condo_fee >= 0),
  iptu numeric(14,2) check (iptu is null or iptu >= 0),
  features text[] not null default '{}',
  photos text[] not null default '{}',
  video_url text,
  slug text,
  code text,
  captado_por uuid references public.company_user(id) on delete set null,
  owner_name text,
  owner_email text,
  owner_phone text,
  listed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_property_company_id on public.property(company_id);
create index if not exists idx_property_company_status on public.property(company_id,status);

create table if not exists public.lead (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  source text not null default 'manual' check (source in ('manual','site','instagram','facebook','google','indicacao','whatsapp','outro')),
  status text not null default 'novo' check (status in ('novo','em_atendimento','qualificado','visita_marcada','proposta','negociacao','fechado','perdido')),
  interest_type text check (interest_type is null or interest_type in ('venda','aluguel','temporada')),
  interest_property_id uuid references public.property(id) on delete set null,
  assigned_to uuid references public.company_user(id) on delete set null,
  budget_max numeric(14,2) check (budget_max is null or budget_max >= 0),
  bedrooms_min integer not null default 0 check (bedrooms_min >= 0),
  neighborhoods text[] not null default '{}',
  notes text,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_lead_company_id on public.lead(company_id);
create index if not exists idx_lead_company_status on public.lead(company_id,status);

create table if not exists public.visit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  property_id uuid not null references public.property(id) on delete cascade,
  property_title text,
  lead_id uuid references public.lead(id) on delete set null,
  lead_name text,
  lead_phone text,
  corretor_id uuid references public.company_user(id) on delete set null,
  corretor_nome text,
  scheduled_at timestamptz not null,
  status text not null default 'agendada' check (status in ('agendada','confirmada','realizada','cancelada','no_show','nao_compareceu')),
  feedback text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_visit_company_id on public.visit(company_id);
create index if not exists idx_visit_lead_id on public.visit(lead_id);
create unique index if not exists visit_property_slot
  on public.visit(property_id,scheduled_at) where status <> 'cancelada';

create table if not exists public.proposal (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  lead_id uuid not null references public.lead(id) on delete restrict,
  property_id uuid not null references public.property(id) on delete restrict,
  corretor_id uuid references public.company_user(id) on delete set null,
  lead_name text,
  property_title text,
  value numeric(14,2) not null check (value >= 0),
  payment_terms text,
  status text not null default 'em_analise' check (status in ('em_analise','aceita','recusada','contra_proposta','expirada')),
  observations text,
  contract_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_proposal_company_id on public.proposal(company_id);
create index if not exists idx_proposal_lead_id on public.proposal(lead_id);

create table if not exists public.commission (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  corretor_id uuid not null references public.company_user(id) on delete restrict,
  corretor_nome text,
  property_id uuid references public.property(id) on delete set null,
  proposal_id uuid references public.proposal(id) on delete set null,
  value numeric(14,2) not null check (value >= 0),
  percentage numeric(5,2) not null default 0 check (percentage between 0 and 100),
  date date not null,
  payment_status text not null default 'pendente' check (payment_status in ('pendente','pago','atrasado','cancelado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_commission_company_id on public.commission(company_id);
create index if not exists idx_commission_date on public.commission(date);
create unique index if not exists commission_proposal_unique
  on public.commission(proposal_id,corretor_id) where proposal_id is not null;

create table if not exists public.revenue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  category text,
  date date not null,
  description text not null,
  payment_status text not null default 'pendente' check (payment_status in ('pendente','pago','atrasado','cancelado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_revenue_company_id on public.revenue(company_id);
create index if not exists idx_revenue_date on public.revenue(date);

create table if not exists public.operational_cost (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  category text,
  date date not null,
  description text not null,
  payment_status text not null default 'pendente' check (payment_status in ('pendente','pago','atrasado','cancelado')),
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_operational_cost_company_id on public.operational_cost(company_id);
create index if not exists idx_operational_cost_date on public.operational_cost(date);

create table if not exists public.zone (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company(id) on delete cascade,
  name text not null,
  city text,
  state text,
  created_at timestamptz not null default now()
);
create index if not exists idx_zone_company_id on public.zone(company_id);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.company(id) on delete cascade,
  role text not null check (role in ('super_admin','admin','corretor','captador','financeiro','demo')),
  created_at timestamptz not null default now()
);
create unique index if not exists user_roles_global_unique on public.user_roles(user_id,role) where company_id is null;
create unique index if not exists user_roles_company_unique on public.user_roles(user_id,role,company_id) where company_id is not null;
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_company_id on public.user_roles(company_id);

-- Authorization helpers are isolated from PostgREST and bypass RLS only for their checks.
create or replace function private.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'super_admin')
    or (
      lower(coalesce(auth.jwt()->>'email','')) = any (
        select lower(email) from public.app_config c,
        lateral unnest(c.super_admin_emails) as email where c.id = 'default'
      )
      and coalesce(auth.jwt()->>'email_verified','false') in ('true','1')
    )
  );
$$;

create or replace function private.has_company_role(p_company_id uuid, p_roles text[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.company_user cu
    where cu.company_id = p_company_id and cu.user_id = auth.uid() and cu.ativo
      and (p_roles is null or cu.role = any(p_roles))
  );
$$;

create or replace function private.can_write_company(p_company_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_super_admin() or private.has_company_role(p_company_id,p_roles);
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.has_company_role(uuid,text[]) to authenticated;
grant execute on function private.can_write_company(uuid,text[]) to authenticated;

-- Only the verified, explicitly configured owner email becomes Master; a random first signup never does.
create or replace function private.sync_imobflow_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  configured_admin boolean;
begin
  insert into public.profiles(user_id,email,updated_at)
  values (new.id, lower(new.email), now())
  on conflict (user_id) do update set email = excluded.email, updated_at = now();

  select exists (
    select 1 from public.app_config c, lateral unnest(c.super_admin_emails) as email
    where c.id = 'default' and lower(email) = lower(new.email)
  ) into configured_admin;

  if configured_admin and new.email_confirmed_at is not null then
    insert into public.user_roles(user_id,role)
    values (new.id,'super_admin') on conflict do nothing;
  else
    delete from public.user_roles where user_id = new.id and role = 'super_admin';
  end if;
  return new;
end;
$$;

 drop trigger if exists imobflow_auth_user_sync on auth.users;
create trigger imobflow_auth_user_sync
after insert or update of email,email_confirmed_at on auth.users
for each row execute function private.sync_imobflow_auth_user();

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['app_config','company','company_user','property','lead','visit','proposal','commission','revenue','operational_cost','profiles'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()', t);
  end loop;
end $$;

-- Prevent ordinary tenant users from changing billing tier, trial, status, or owner identity.
create or replace function private.protect_company_system_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_super_admin() and (
    new.plano is distinct from old.plano or new.status is distinct from old.status
    or new.trial_ate is distinct from old.trial_ate
    or lower(coalesce(new.owner_email,'')) is distinct from lower(coalesce(old.owner_email,''))
  ) then
    raise exception 'Campos administrativos da imobiliária não podem ser alterados por este usuário';
  end if;
  return new;
end;
$$;
create trigger protect_company_system_fields before update on public.company
for each row execute function private.protect_company_system_fields();

-- A company can be registered by its verified owner, with safe defaults only.
create or replace function private.validate_company_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_super_admin() and (
    auth.uid() is null or lower(coalesce(new.owner_email,'')) <> lower(coalesce(auth.jwt()->>'email',''))
    or coalesce(auth.jwt()->>'email_verified','false') not in ('true','1')
    or new.status <> 'trial' or new.plano <> 'starter'
    or exists (select 1 from public.company_user cu where cu.user_id = auth.uid())
  ) then
    raise exception 'Cadastro de imobiliária inválido';
  end if;
  return new;
end;
$$;
create trigger validate_company_insert before insert on public.company
for each row execute function private.validate_company_insert();

-- RLS is enabled everywhere; only authenticated tenant users and the configured Master are granted access.
do $$
declare t text;
begin
  foreach t in array array['app_config','company','company_user','property','lead','visit','proposal','commission','revenue','operational_cost','zone','profiles','user_roles'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

revoke all on public.app_config, public.company, public.company_user, public.property, public.lead,
  public.visit, public.proposal, public.commission, public.revenue, public.operational_cost,
  public.zone, public.profiles, public.user_roles from anon;
grant select, update on public.app_config to authenticated;
grant select, insert, update, delete on public.company, public.company_user, public.property,
  public.lead, public.visit, public.proposal, public.commission, public.revenue,
  public.operational_cost, public.zone to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

create policy app_config_read_master on public.app_config for select to authenticated using (private.is_super_admin());
create policy app_config_update_master on public.app_config for update to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

create policy company_read_member on public.company for select to authenticated using (private.is_super_admin() or private.has_company_role(id,null));
create policy company_insert_owner on public.company for insert to authenticated with check (
  private.is_super_admin() or (lower(coalesce(owner_email,''))=lower(coalesce(auth.jwt()->>'email',''))
  and coalesce(auth.jwt()->>'email_verified','false') in ('true','1') and status='trial' and plano='starter')
);
create policy company_update_admin on public.company for update to authenticated using (private.is_super_admin() or private.has_company_role(id,array['owner','admin'])) with check (private.is_super_admin() or private.has_company_role(id,array['owner','admin']));
create policy company_delete_master on public.company for delete to authenticated using (private.is_super_admin());

create policy company_user_read_member on public.company_user for select to authenticated using (
  private.is_super_admin() or private.has_company_role(company_id,null) or user_id=auth.uid()
);
create policy company_user_insert_invited_or_owner on public.company_user for insert to authenticated with check (
  private.is_super_admin()
  or (user_id is null and role <> 'owner' and (
    private.has_company_role(company_id,array['owner'])
    or (role <> 'admin' and private.has_company_role(company_id,array['admin']))
  ))
  or (user_id=auth.uid() and role='owner' and lower(email)=lower(coalesce(auth.jwt()->>'email',''))
      and exists(select 1 from public.company c where c.id=company_id and lower(c.owner_email)=lower(coalesce(auth.jwt()->>'email','')))
      and not exists(select 1 from public.company_user other where other.user_id=auth.uid()))
);
create policy company_user_update_admin on public.company_user for update to authenticated
using (private.is_super_admin() or (role <> 'owner' and (private.has_company_role(company_id,array['owner']) or private.has_company_role(company_id,array['admin']))))
with check (private.is_super_admin() or (role <> 'owner' and (private.has_company_role(company_id,array['owner']) or private.has_company_role(company_id,array['admin']))));
create policy company_user_delete_admin on public.company_user for delete to authenticated
using (private.is_super_admin() or (role <> 'owner' and (private.has_company_role(company_id,array['owner']) or private.has_company_role(company_id,array['admin']))));

create policy profiles_read_self on public.profiles for select to authenticated using (user_id=auth.uid() or private.is_super_admin());
create policy profiles_insert_self on public.profiles for insert to authenticated with check (user_id=auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy profiles_delete_self on public.profiles for delete to authenticated using (user_id=auth.uid());
create policy user_roles_read_self on public.user_roles for select to authenticated using (user_id=auth.uid() or private.is_super_admin());

-- Tenant tables: membership scopes every row; financial and team writes are role-limited.
do $$
declare t text; roles text[];
begin
  foreach t in array array['property','lead','visit','proposal','commission','revenue','operational_cost','zone'] loop
    execute format('create policy %I on public.%I for select to authenticated using (private.is_super_admin() or private.has_company_role(company_id,null))', t||'_read_company', t);
    if t='property' then roles:=array['owner','admin','corretor','captador'];
    elsif t in ('lead','visit','proposal') then roles:=array['owner','admin','corretor'];
    elsif t in ('commission','revenue','operational_cost') then roles:=array['owner','admin','financeiro'];
    else roles:=array['owner','admin']; end if;
    execute format('create policy %I on public.%I for insert to authenticated with check (private.is_super_admin() or private.has_company_role(company_id,%L::text[]))', t||'_insert_company', t, roles);
    execute format('create policy %I on public.%I for update to authenticated using (private.is_super_admin() or private.has_company_role(company_id,%L::text[])) with check (private.is_super_admin() or private.has_company_role(company_id,%L::text[]))', t||'_update_company', t, roles, roles);
    execute format('create policy %I on public.%I for delete to authenticated using (private.is_super_admin() or private.has_company_role(company_id,%L::text[]))', t||'_delete_company', t, roles);
  end loop;
end $$;

-- No API secrets or sample customers are stored in this script. Anonymous access is intentionally closed.
