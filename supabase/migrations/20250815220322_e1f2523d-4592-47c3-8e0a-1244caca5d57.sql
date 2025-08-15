
-- Proteção de dados de pagamento na tabela public.payments
-- Mantém o foco do projeto e não altera a tabela public.pagamentos (já segura)
-- Implementa RLS robusto, remove políticas permissivas e preserva Edge Functions (service_role)

-- 1) Função de checagem de admin, alinhada ao padrão existente (profiles.user_type = 'admin')
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.user_type = 'admin'
  );
$$;

-- 2) Aplicar correções apenas se a tabela public.payments existir
do $$
declare
  pol record;
begin
  if to_regclass('public.payments') is null then
    raise notice 'Tabela public.payments não encontrada. Nada a fazer.';
    return;
  end if;

  -- 2.1) Adicionar coluna de propriedade (user_id) se não existir
  execute 'alter table public.payments add column if not exists user_id uuid';

  -- 2.2) Índice para performance das políticas
  execute 'create index if not exists idx_payments_user_id on public.payments(user_id)';

  -- 2.3) Backfill opcional: tentar vincular user_id via consultas (paciente)
  -- Apenas quando consultation_id aponta para uma consulta existente
  execute $sql$
    update public.payments p
    set user_id = c.paciente_id
    from public.consultas c
    where p.consultation_id = c.id
      and p.user_id is null
  $sql$;

  -- 2.4) Habilitar RLS
  execute 'alter table public.payments enable row level security';

  -- 2.5) Remover TODAS as políticas existentes (para eliminar políticas permissivas "true")
  for pol in
    select polname
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'payments'
  loop
    execute format('drop policy if exists %I on public.payments', pol.polname);
  end loop;

  -- 2.6) Criar políticas seguras por operação
  -- Regras: Dono (user_id = auth.uid()) OR Admin (is_admin()) OR service_role (edge functions)
  -- SELECT
  execute $sql$
    create policy payments_select_owner_or_admin
    on public.payments
    for select
    to authenticated
    using (
      user_id = auth.uid()
      or public.is_admin()
      or current_setting('role', true) = 'service_role'
    )
  $sql$;

  -- INSERT
  execute $sql$
    create policy payments_insert_owner_or_admin
    on public.payments
    for insert
    to authenticated
    with check (
      user_id = auth.uid()
      or public.is_admin()
      or current_setting('role', true) = 'service_role'
    )
  $sql$;

  -- UPDATE
  execute $sql$
    create policy payments_update_owner_or_admin
    on public.payments
    for update
    to authenticated
    using (
      user_id = auth.uid()
      or public.is_admin()
      or current_setting('role', true) = 'service_role'
    )
    with check (
      user_id = auth.uid()
      or public.is_admin()
      or current_setting('role', true) = 'service_role'
    )
  $sql$;

  -- DELETE
  execute $sql$
    create policy payments_delete_owner_or_admin
    on public.payments
    for delete
    to authenticated
    using (
      user_id = auth.uid()
      or public.is_admin()
      or current_setting('role', true) = 'service_role'
    )
  $sql$;

  -- Opcional: impedir qualquer acesso explícito ao papel anon
  -- (Sem políticas para 'anon', RLS já bloqueia por padrão. Mantemos simples.)

  raise notice 'RLS seguro aplicado em public.payments com sucesso.';
end
$$;
