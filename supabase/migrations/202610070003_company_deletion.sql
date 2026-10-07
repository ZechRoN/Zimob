-- Master-only deletion. Confirmation delay is enforced by the database as well as the UI.
create table private.company_deletion_request (
  company_id uuid not null references public.company(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  requested_at timestamptz not null default clock_timestamp(),
  primary key (company_id, requested_by)
);
alter table private.company_deletion_request enable row level security;
revoke all on private.company_deletion_request from public, anon, authenticated;
revoke delete on public.company from authenticated;
drop policy if exists company_delete_master on public.company;

create or replace function public.zimob_delete_company(input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target public.company%rowtype;
  request private.company_deletion_request%rowtype;
begin
  if not private.is_super_admin() then
    raise exception 'Somente o Master pode excluir uma imobiliária.';
  end if;
  select * into target from public.company where id=(input->>'companyId')::uuid for update;
  if not found then raise exception 'Imobiliária não encontrada.'; end if;
  if target.status not in ('blocked','canceled') then
    raise exception 'A imobiliária precisa estar desativada (suspensa ou cancelada).';
  end if;
  if nullif(input->>'token','') is null then
    insert into private.company_deletion_request(company_id,requested_by)
      values(target.id,auth.uid())
      on conflict(company_id,requested_by) do update
        set token=gen_random_uuid(),requested_at=clock_timestamp()
      returning * into request;
    return jsonb_build_object('token',request.token,'waitSeconds',10);
  end if;
  select * into request from private.company_deletion_request
    where company_id=target.id and requested_by=auth.uid() and token=(input->>'token')::uuid for update;
  if not found then raise exception 'Confirmação inválida. Abra a exclusão novamente.'; end if;
  if clock_timestamp() < request.requested_at + interval '10 seconds' then
    raise exception 'Aguarde os 10 segundos antes de confirmar.';
  end if;
  if clock_timestamp() > request.requested_at + interval '5 minutes' then
    raise exception 'Confirmação expirada. Abra a exclusão novamente.';
  end if;
  -- Remove commissions before company_user to respect the restrictive broker foreign key.
  delete from public.commission where company_id=target.id;
  delete from public.company where id=target.id;
  -- Auth users can belong to other companies and must never be deleted here.
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.zimob_delete_company(jsonb) from public, anon;
grant execute on function public.zimob_delete_company(jsonb) to authenticated;
