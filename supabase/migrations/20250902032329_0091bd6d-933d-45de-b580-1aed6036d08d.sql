-- Complete rebuild: Drop existing views and tables, create new schema with availability
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing views and tables in proper order
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.pagamentos CASCADE;
DROP TABLE IF EXISTS public.consultas CASCADE;
DROP TABLE IF EXISTS public.locais_atendimento CASCADE;
DROP TABLE IF EXISTS public.medicos CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;
DROP TABLE IF EXISTS public.health_metrics CASCADE;
DROP TABLE IF EXISTS public.integration_logs CASCADE;
DROP TABLE IF EXISTS public.especialidades_medicas CASCADE;

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
-- DISPONIBILIDADE DE MÉDICOS (NOVO)
-- =========================================
create table public.doctor_availability (
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
create index idx_doctor_availability_medico_weekday on public.doctor_availability(medico_id, weekday);
create index idx_doctor_availability_active on public.doctor_availability(is_active);

-- =========================================
-- FOLGAS/AUSÊNCIAS DO MÉDICO
-- =========================================
create table public.doctor_time_off (
  id bigserial primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz default now(),
  check (start_at < end_at)
);
create index idx_doctor_time_off_medico on public.doctor_time_off(medico_id);
create index idx_doctor_time_off_range on public.doctor_time_off(start_at, end_at);

-- =========================================
-- SEED: ESPECIALIDADES BÁSICAS
-- =========================================
INSERT INTO public.especialidades_medicas (nome, ativa) VALUES
('Cardiologia', true),
('Dermatologia', true),
('Endocrinologia', true),
('Ginecologia', true),
('Neurologia', true),
('Oftalmologia', true),
('Ortopedia', true),
('Pediatria', true),
('Psiquiatria', true),
('Urologia', true),
('Clínica Geral', true)
ON CONFLICT (nome) DO NOTHING;

-- =========================================
-- STORAGE BUCKET (PUBLIC)
-- =========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public', 'public', true, 52428800, null)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- POLÍTICAS RLS (definidas; RLS permanece DESABILITADO)
-- =========================================
-- Médicos
create policy "Médico: insere o próprio registro"
  on public.medicos for insert with check (auth.uid() = user_id);
create policy "Médico: visualiza/edita o próprio registro"
  on public.medicos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Pacientes
create policy "Paciente: insere o próprio registro"
  on public.pacientes for insert with check (auth.uid() = user_id);
create policy "Paciente: visualiza/edita o próprio registro"
  on public.pacientes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Locais de atendimento
create policy "Local: médico gerencia seus locais"
  on public.locais_atendimento for all using (auth.uid() = medico_id) with check (auth.uid() = medico_id);
create policy "Locais: consulta pública em locais ativos"
  on public.locais_atendimento for select using (ativo = true);

-- Consultas
create policy "Consultas: médico vê consultas"
  on public.consultas for select using (auth.uid() = medico_id);
create policy "Consultas: paciente vê consultas"
  on public.consultas for select using (auth.uid() = paciente_id);
create policy "Consultas: paciente agenda"
  on public.consultas for insert with check (auth.uid() = paciente_id);
create policy "Consultas: médico atualiza status"
  on public.consultas for update using (auth.uid() = medico_id) with check (auth.uid() = medico_id);

-- Pagamentos
create policy "Pagamentos: paciente vê seus pagamentos"
  on public.pagamentos for select using (auth.uid() = paciente_id);
create policy "Pagamentos: médico vê seus pagamentos"
  on public.pagamentos for select using (auth.uid() = medico_id);
create policy "Pagamentos: paciente cria pagamento"
  on public.pagamentos for insert with check (auth.uid() = paciente_id);

-- Métricas
create policy "Métricas: paciente vê suas métricas"
  on public.health_metrics for select using (auth.uid() = patient_id);
create policy "Métricas: paciente insere métricas"
  on public.health_metrics for insert with check (auth.uid() = patient_id);
create policy "Métricas: paciente atualiza métricas"
  on public.health_metrics for update using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

-- Disponibilidade (consulta pública)
create policy "Disponibilidade: pacientes consultam"
  on public.doctor_availability for select using (true);
create policy "Disponibilidade: médico gerencia própria"
  on public.doctor_availability for all using (auth.uid() = medico_id) with check (auth.uid() = medico_id);

-- Folgas
create policy "Folgas: médico gerencia próprias"
  on public.doctor_time_off for all using (auth.uid() = medico_id) with check (auth.uid() = medico_id);