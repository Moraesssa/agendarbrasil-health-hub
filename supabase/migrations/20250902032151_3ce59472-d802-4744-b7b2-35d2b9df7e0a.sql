-- Rebuild core schema + availability (RLS definitions only; RLS stays disabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop conflicting core tables (safe if absent)
DROP TABLE IF EXISTS public.pagamentos CASCADE;
DROP TABLE IF EXISTS public.consultas CASCADE;
DROP TABLE IF EXISTS public.locais_atendimento CASCADE;
DROP TABLE IF EXISTS public.medicos CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;
DROP TABLE IF EXISTS public.health_metrics CASCADE;
DROP TABLE IF EXISTS public.integration_logs CASCADE;
DROP TABLE IF EXISTS public.especialidades_medicas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =========================================
-- PERFIL DE USUÁRIOS
-- =========================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  photo_url text,
  user_type text check (user_type in ('medico','paciente')),
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_profiles_email on public.profiles(email);

-- =========================================
-- MÉDICOS
-- =========================================
create table if not exists public.medicos (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  crm text,
  especialidades jsonb,
  configuracoes jsonb,
  telefone text,
  cidade text,
  estado text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_medicos_user_id on public.medicos(user_id);
create index if not exists idx_medicos_estado_cidade on public.medicos(estado, cidade);
create index if not exists idx_medicos_especialidades_gin on public.medicos using gin (especialidades);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at' AND pg_function_is_visible(oid)
  ) THEN
    DROP TRIGGER IF EXISTS trg_medicos_updated_at ON public.medicos;
    CREATE TRIGGER trg_medicos_updated_at
      BEFORE UPDATE ON public.medicos
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- =========================================
-- PACIENTES
-- =========================================
create table if not exists public.pacientes (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dados_pessoais jsonb,
  endereco jsonb,
  convenio jsonb,
  dados_medicos jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_pacientes_user_id on public.pacientes(user_id);

-- =========================================
-- LOCAIS DE ATENDIMENTO
-- =========================================
create table if not exists public.locais_atendimento (
  id bigserial primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  nome_local text,
  endereco jsonb,
  cidade text,
  estado text,
  coordenadas jsonb,
  horario_funcionamento jsonb,
  ativo boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_locais_medico_id on public.locais_atendimento(medico_id);
create index if not exists idx_locais_estado_cidade on public.locais_atendimento(estado, cidade);
create index if not exists idx_locais_ativo on public.locais_atendimento(ativo);

-- =========================================
-- CONSULTAS
-- =========================================
create table if not exists public.consultas (
  id bigserial primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  paciente_familiar_id uuid references public.profiles(id),
  consultation_date timestamptz not null,
  consultation_type text,
  status text default 'pending',
  expires_at timestamptz,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_consultas_medico_date on public.consultas(medico_id, consultation_date);
create index if not exists idx_consultas_paciente_date on public.consultas(paciente_id, consultation_date);
create index if not exists idx_consultas_status on public.consultas(status);

-- =========================================
-- PAGAMENTOS
-- =========================================
create table if not exists public.pagamentos (
  id bigserial primary key,
  consulta_id bigint not null references public.consultas(id) on delete cascade,
  medico_id uuid not null references public.profiles(id),
  paciente_id uuid not null references public.profiles(id),
  usuario_id uuid not null references public.profiles(id),
  valor numeric(10,2) not null,
  moeda text default 'BRL',
  status text default 'pendente',
  metodo text,
  transacao_gateway jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_pagamentos_consulta_id on public.pagamentos(consulta_id);
create index if not exists idx_pagamentos_status on public.pagamentos(status);
create index if not exists idx_pagamentos_medico_id on public.pagamentos(medico_id);

-- =========================================
-- ESPECIALIDADES MÉDICAS
-- =========================================
create table if not exists public.especialidades_medicas (
  id bigserial primary key,
  nome text unique not null,
  ativa boolean default true
);
create index if not exists idx_especialidades_ativas on public.especialidades_medicas(ativa);

-- =========================================
-- MÉTRICAS DE SAÚDE (EXEMPLO)
-- =========================================
create table if not exists public.health_metrics (
  id bigserial primary key,
  patient_id uuid not null references public.profiles(id),
  tipo text not null,
  valor numeric,
  unidade text,
  registrado_em timestamptz default now()
);
create index if not exists idx_health_metrics_patient_date on public.health_metrics(patient_id, registrado_em);

-- =========================================
-- LOGS DE INTEGRAÇÃO
-- =========================================
create table if not exists public.integration_logs (
  id bigserial primary key,
  source text,
  payload jsonb,
  created_at timestamptz default now()
);

-- =========================================
-- DISPONIBILIDADE DE MÉDICOS (NOVO)
-- =========================================
create table if not exists public.doctor_availability (
  id bigserial primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  location_id bigint references public.locais_atendimento(id) on delete set null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time without time zone not null,
  end_time time without time zone not null,
  slot_duration_minutes int not null default 30 check (slot_duration_minutes > 0),
  valid_from date,
  valid_until date,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (start_time < end_time)
);
create index if not exists idx_doctor_availability_medico_weekday on public.doctor_availability(medico_id, weekday);
create index if not exists idx_doctor_availability_active on public.doctor_availability(is_active);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at' AND pg_function_is_visible(oid)
  ) THEN
    DROP TRIGGER IF EXISTS trg_doctor_availability_updated_at ON public.doctor_availability;
    CREATE TRIGGER trg_doctor_availability_updated_at
      BEFORE UPDATE ON public.doctor_availability
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- Ausências / folgas do médico
create table if not exists public.doctor_time_off (
  id bigserial primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz default now(),
  check (start_at < end_at)
);
create index if not exists idx_doctor_time_off_medico on public.doctor_time_off(medico_id);
create index if not exists idx_doctor_time_off_range on public.doctor_time_off(start_at, end_at);

-- =========================================
-- POLÍTICAS (definidas agora; RLS será habilitado em etapa posterior)
-- =========================================
-- Médicos
create policy "Médico: insere o próprio registro"
  on public.medicos
  for insert with check (auth.uid() = user_id);

create policy "Médico: visualiza/edita o próprio registro"
  on public.medicos
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Pacientes
create policy "Paciente: insere o próprio registro"
  on public.pacientes
  for insert with check (auth.uid() = user_id);

create policy "Paciente: visualiza/edita o próprio registro"
  on public.pacientes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Locais de atendimento
create policy "Local: médico gerencia seus locais"
  on public.locais_atendimento
  for all using (auth.uid() = medico_id)
  with check (auth.uid() = medico_id);

create policy "Locais: consulta pública em locais ativos"
  on public.locais_atendimento
  for select using (ativo = true);

-- Consultas
create policy "Consultas: médico vê consultas"
  on public.consultas
  for select using (auth.uid() = medico_id);

create policy "Consultas: paciente vê consultas"
  on public.consultas
  for select using (auth.uid() = paciente_id);

create policy "Consultas: paciente agenda"
  on public.consultas
  for insert with check (auth.uid() = paciente_id);

create policy "Consultas: médico atualiza status"
  on public.consultas
  for update using (auth.uid() = medico_id)
  with check (auth.uid() = medico_id);

-- Pagamentos
create policy "Pagamentos: paciente vê seus pagamentos"
  on public.pagamentos
  for select using (auth.uid() = paciente_id);

create policy "Pagamentos: médico vê seus pagamentos"
  on public.pagamentos
  for select using (auth.uid() = medico_id);

create policy "Pagamentos: paciente cria pagamento"
  on public.pagamentos
  for insert with check (auth.uid() = paciente_id);

-- Métricas
create policy "Métricas: paciente vê suas métricas"
  on public.health_metrics
  for select using (auth.uid() = patient_id);

create policy "Métricas: paciente insere métricas"
  on public.health_metrics
  for insert with check (auth.uid() = patient_id);

create policy "Métricas: paciente atualiza métricas"
  on public.health_metrics
  for update using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

-- Disponibilidade (consulta pública/autenticada)
create policy "Disponibilidade: pacientes consultam"
  on public.doctor_availability
  for select using (true);
