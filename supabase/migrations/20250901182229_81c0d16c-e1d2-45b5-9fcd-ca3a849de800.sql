
-- 0001_reset_and_init_schema.sql
-- Extensões necessárias
create extension if not exists pgcrypto;

-- DROP LEGADO (somente as tabelas que vamos recriar)
drop table if exists public.pagamentos cascade;
drop table if exists public.consultas cascade;
drop table if exists public.locais_atendimento cascade;
drop table if exists public.pacientes cascade;
drop table if exists public.medicos cascade;
drop table if exists public.especialidades_medicas cascade;
drop table if exists public.health_metrics cascade;
drop table if exists public.integration_logs cascade;
drop table if exists public.profiles cascade;

-- (Se existirem versões com nome capitalizado no banco)
drop table if exists public."Consultas" cascade;
drop table if exists public."Medicos" cascade;
drop table if exists public."Pacientes" cascade;

-- =========================================
-- PERFIL DE USUÁRIOS
-- =========================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  photo_url text,
  user_type text check (user_type in ('medico','paciente')),
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_profiles_email on public.profiles(email);

-- =========================================
-- MÉDICOS
-- =========================================
create table public.medicos (
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

create index idx_medicos_user_id on public.medicos(user_id);
create index idx_medicos_estado_cidade on public.medicos(estado, cidade);
create index idx_medicos_especialidades_gin on public.medicos using gin (especialidades);

-- =========================================
-- PACIENTES
-- =========================================
create table public.pacientes (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dados_pessoais jsonb,
  endereco jsonb,
  convenio jsonb,
  dados_medicos jsonb,
  created_at timestamptz default now()
);

create index idx_pacientes_user_id on public.pacientes(user_id);

-- =========================================
-- LOCAIS DE ATENDIMENTO
-- =========================================
create table public.locais_atendimento (
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

create index idx_locais_medico_id on public.locais_atendimento(medico_id);
create index idx_locais_estado_cidade on public.locais_atendimento(estado, cidade);
create index idx_locais_ativo on public.locais_atendimento(ativo);

-- =========================================
-- CONSULTAS
-- =========================================
create table public.consultas (
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

create index idx_consultas_medico_date on public.consultas(medico_id, consultation_date);
create index idx_consultas_paciente_date on public.consultas(paciente_id, consultation_date);
create index idx_consultas_status on public.consultas(status);

-- =========================================
-- PAGAMENTOS
-- =========================================
create table public.pagamentos (
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

create index idx_pagamentos_consulta_id on public.pagamentos(consulta_id);
create index idx_pagamentos_status on public.pagamentos(status);
create index idx_pagamentos_medico_id on public.pagamentos(medico_id);

-- =========================================
-- ESPECIALIDADES MÉDICAS
-- =========================================
create table public.especialidades_medicas (
  id bigserial primary key,
  nome text unique not null,
  ativa boolean default true
);

create index idx_especialidades_ativas on public.especialidades_medicas(ativa);

-- =========================================
-- MÉTRICAS DE SAÚDE
-- =========================================
create table public.health_metrics (
  id bigserial primary key,
  patient_id uuid not null references public.profiles(id),
  tipo text not null,
  valor numeric,
  unidade text,
  registrado_em timestamptz default now()
);

create index idx_health_metrics_patient_date on public.health_metrics(patient_id, registrado_em);

-- =========================================
-- LOGS DE INTEGRAÇÃO
-- =========================================
create table public.integration_logs (
  id bigserial primary key,
  source text,
  payload jsonb,
  created_at timestamptz default now()
);

-- =========================================
-- DISPONIBILIDADE (para horários preconfigurados)
-- =========================================
-- Janela recorrente de atendimento (por dia da semana e local)
create table public.doctor_availability (
  id bigserial primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  location_id bigint references public.locais_atendimento(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=domingo ... 6=sábado
  start_time time not null,
  end_time time not null,
  slot_duration_minutes int not null default 30 check (slot_duration_minutes > 0 and slot_duration_minutes <= 480),
  valid_from date,
  valid_to date,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_availability_medico on public.doctor_availability(medico_id);
create index idx_availability_location on public.doctor_availability(location_id);
create index idx_availability_weekday on public.doctor_availability(weekday);

-- Exceções/folgas/feriados
create table public.doctor_time_off (
  id bigserial primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  location_id bigint references public.locais_atendimento(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz default now()
);

create index idx_timeoff_medico on public.doctor_time_off(medico_id);
create index idx_timeoff_date on public.doctor_time_off(date);

-- =========================================
-- Garantir RLS DESABILITADO (por segurança)
-- =========================================
alter table public.profiles            disable row level security;
alter table public.medicos             disable row level security;
alter table public.pacientes           disable row level security;
alter table public.locais_atendimento  disable row level security;
alter table public.consultas           disable row level security;
alter table public.pagamentos          disable row level security;
alter table public.especialidades_medicas disable row level security;
alter table public.health_metrics      disable row level security;
alter table public.integration_logs    disable row level security;
alter table public.doctor_availability disable row level security;
alter table public.doctor_time_off     disable row level security;

-- =========================================
-- POLÍTICAS (não ativas até habilitar RLS)
-- =========================================
-- Médicos
create policy if not exists "Médico: insere o próprio registro"
on public.medicos
for insert
with check (auth.uid() = user_id);

create policy if not exists "Médico: visualiza/edita o próprio registro"
on public.medicos
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Pacientes
create policy if not exists "Paciente: insere o próprio registro"
on public.pacientes
for insert
with check (auth.uid() = user_id);

create policy if not exists "Paciente: visualiza/edita o próprio registro"
on public.pacientes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Locais de atendimento
create policy if not exists "Local: médico gerencia seus locais"
on public.locais_atendimento
for all
using (auth.uid() = medico_id)
with check (auth.uid() = medico_id);

create policy if not exists "Locais: consulta pública em locais ativos"
on public.locais_atendimento
for select
using (ativo = true);

-- Consultas
create policy if not exists "Consultas: médico vê consultas"
on public.consultas
for select
using (auth.uid() = medico_id);

create policy if not exists "Consultas: paciente vê consultas"
on public.consultas
for select
using (auth.uid() = paciente_id);

create policy if not exists "Consultas: paciente agenda"
on public.consultas
for insert
with check (auth.uid() = paciente_id);

create policy if not exists "Consultas: médico atualiza status"
on public.consultas
for update
using (auth.uid() = medico_id)
with check (auth.uid() = medico_id);

-- Pagamentos
create policy if not exists "Pagamentos: paciente vê seus pagamentos"
on public.pagamentos
for select
using (auth.uid() = paciente_id);

create policy if not exists "Pagamentos: médico vê seus pagamentos"
on public.pagamentos
for select
using (auth.uid() = medico_id);

create policy if not exists "Pagamentos: paciente cria pagamento"
on public.pagamentos
for insert
with check (auth.uid() = paciente_id);

-- Métricas de saúde
create policy if not exists "Métricas: paciente vê suas métricas"
on public.health_metrics
for select
using (auth.uid() = patient_id);

create policy if not exists "Métricas: paciente insere métricas"
on public.health_metrics
for insert
with check (auth.uid() = patient_id);

create policy if not exists "Métricas: paciente atualiza métricas"
on public.health_metrics
for update
using (auth.uid() = patient_id)
with check (auth.uid() = patient_id);

-- Disponibilidade (horários) - leitura ampla para pacientes autenticados
create policy if not exists "Disponibilidade: pacientes podem ver horários"
on public.doctor_availability
for select
to authenticated
using (active = true);

create policy if not exists "Disponibilidade: médico gerencia seus horários"
on public.doctor_availability
for all
using (auth.uid() = medico_id)
with check (auth.uid() = medico_id);

create policy if not exists "Indisponibilidades: pacientes veem bloqueios"
on public.doctor_time_off
for select
to authenticated
using (true);

create policy if not exists "Indisponibilidades: médico gerencia"
on public.doctor_time_off
for all
using (auth.uid() = medico_id)
with check (auth.uid() = medico_id);

-- =========================================
-- SEEDS BÁSICOS
-- =========================================
insert into public.especialidades_medicas (nome, ativa) values
  ('Clínico Geral', true),
  ('Cardiologia', true),
  ('Pediatria', true),
  ('Dermatologia', true),
  ('Ginecologia', true),
  ('Ortopedia', true)
on conflict (nome) do nothing;

-- =========================================
-- STORAGE BUCKET PÚBLICO
-- =========================================
do $$
begin
  -- cria bucket 'public' se não existir
  if not exists (select 1 from storage.buckets where id = 'public') then
    perform storage.create_bucket('public', public := true);
  end if;
end$$;
