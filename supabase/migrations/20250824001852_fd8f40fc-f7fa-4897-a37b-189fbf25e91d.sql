
-- ================================
-- FASE 1 — BACKEND NORMALIZADO (PASSO 1/2)
-- Criação segura dos enums, tabelas, RLS, views, triggers e migração de dados
-- Compatível com o schema atual e sem quebrar a aplicação existente
-- ================================

begin;

-- 1) Enums (criados apenas se não existirem)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('pending','confirmed','canceled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('credit','pix');
  end if;
  if not exists (select 1 from pg_type where typname = 'family_relation') then
    create type public.family_relation as enum ('spouse','child','parent','sibling');
  end if;
  if not exists (select 1 from pg_type where typname = 'health_metric_type') then
    create type public.health_metric_type as enum ('blood_pressure','weight','heart_rate');
  end if;
  if not exists (select 1 from pg_type where typname = 'fhir_resource_type') then
    create type public.fhir_resource_type as enum ('Patient','Observation','Condition','Appointment');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('reminder','referral','update');
  end if;
  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type public.audit_action as enum ('insert','update','delete');
  end if;
  if not exists (select 1 from pg_type where typname = 'certificate_type') then
    create type public.certificate_type as enum ('medical_leave','fitness_certificate','vaccination_certificate','medical_report');
  end if;
  if not exists (select 1 from pg_type where typname = 'exam_status') then
    create type public.exam_status as enum ('scheduled','completed','cancelled','pending_results');
  end if;
  if not exists (select 1 from pg_type where typname = 'triage_status') then
    create type public.triage_status as enum ('pending','reviewed','scheduled');
  end if;
  if not exists (select 1 from pg_type where typname = 'urgency_level') then
    create type public.urgency_level as enum ('low','medium','high','emergency');
  end if;
  if not exists (select 1 from pg_type where typname = 'location_status') then
    create type public.location_status as enum ('ativo','temporariamente_fechado','manutencao');
  end if;
end $$;

-- 2) Tabelas normalizadas (sem substituir as existentes)
-- Observação: Reutilizamos public.especialidades_medicas já existente
-- Mantemos profiles como está (id = auth.users.id), sem recriar

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  crm_number text not null unique,
  specialty_id uuid references public.especialidades_medicas(id),
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip_code text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  phone text,
  whatsapp text,
  status public.location_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  day_of_week int not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  slot_duration int not null default 30,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

-- Criamos appointments canônica (não quebra 'consultas'/'consultations' existentes)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete set null,
  doctor_id uuid not null references public.doctors(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

-- 3) Índices
create index if not exists idx_appointments_doctor_start on public.appointments(doctor_id, start_time);
create index if not exists idx_schedules_doctor_day on public.schedules(doctor_id, day_of_week);
create index if not exists idx_locations_city on public.locations(city);

-- 4) Triggers de updated_at e prevenção de colisões de horário

-- Função única para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Atribuir triggers de updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'trg_doctors_updated_at'
  ) then
    create trigger trg_doctors_updated_at
    before update on public.doctors
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger 
    where tgname = 'trg_locations_updated_at'
  ) then
    create trigger trg_locations_updated_at
    before update on public.locations
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger 
    where tgname = 'trg_schedules_updated_at'
  ) then
    create trigger trg_schedules_updated_at
    before update on public.schedules
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger 
    where tgname = 'trg_appointments_updated_at'
  ) then
    create trigger trg_appointments_updated_at
    before update on public.appointments
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Função para prevenir double-booking do mesmo médico
create or replace function public.prevent_double_booking()
returns trigger
language plpgsql
security definer
as $$
begin
  if exists (
    select 1 
    from public.appointments a
    where a.doctor_id = new.doctor_id
      and a.status <> 'canceled'
      and (new.start_time < a.end_time and new.end_time > a.start_time)
      and (tg_op = 'INSERT' or a.id <> new.id)
  ) then
    raise exception 'Horário já ocupado para este médico';
  end if;
  return new;
end;
$$;

-- Trigger de verificação de conflito
do $$
begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'trg_appointments_double_booking'
  ) then
    create trigger trg_appointments_double_booking
    before insert or update on public.appointments
    for each row execute function public.prevent_double_booking();
  end if;
end $$;

-- 5) RLS (ativar e criar políticas)
alter table public.doctors enable row level security;
alter table public.locations enable row level security;
alter table public.schedules enable row level security;
alter table public.appointments enable row level security;

-- Doctors: leitura pública, mutações apenas pelo dono (profile_id = auth.uid())
do $$
begin
  -- SELECT público
  if not exists (
    select 1 from pg_policies where policyname = 'Public can view doctors' and tablename = 'doctors'
  ) then
    create policy "Public can view doctors"
    on public.doctors
    for select
    using (true);
  end if;

  -- INSERT/UPDATE/DELETE pelo dono (médico)
  if not exists (
    select 1 from pg_policies where policyname = 'Doctors manage their own doctor row' and tablename = 'doctors'
  ) then
    create policy "Doctors manage their own doctor row"
    on public.doctors
    for all
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());
  end if;
end $$;

-- Locations: leitura pública, mutações pelo dono (dono = médico da location)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Public can view locations' and tablename = 'locations'
  ) then
    create policy "Public can view locations"
    on public.locations
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'Doctors manage their own locations' and tablename = 'locations'
  ) then
    create policy "Doctors manage their own locations"
    on public.locations
    for all
    using (exists (select 1 from public.doctors d where d.id = locations.doctor_id and d.profile_id = auth.uid()))
    with check (exists (select 1 from public.doctors d where d.id = locations.doctor_id and d.profile_id = auth.uid()));
  end if;
end $$;

-- Schedules: leitura pública (ou ao menos para autenticados), mutações pelo dono
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Public can view schedules' and tablename = 'schedules'
  ) then
    create policy "Public can view schedules"
    on public.schedules
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'Doctors manage their own schedules' and tablename = 'schedules'
  ) then
    create policy "Doctors manage their own schedules"
    on public.schedules
    for all
    using (exists (select 1 from public.doctors d where d.id = schedules.doctor_id and d.profile_id = auth.uid()))
    with check (exists (select 1 from public.doctors d where d.id = schedules.doctor_id and d.profile_id = auth.uid()));
  end if;
end $$;

-- Appointments: pacientes e médicos podem ver/criar suas próprias; updates por envolvidos
do $$
begin
  -- SELECT para paciente
  if not exists (
    select 1 from pg_policies where policyname = 'Patients can view their appointments' and tablename = 'appointments'
  ) then
    create policy "Patients can view their appointments"
    on public.appointments
    for select
    using (patient_id = auth.uid());
  end if;

  -- SELECT para médico
  if not exists (
    select 1 from pg_policies where policyname = 'Doctors can view their appointments' and tablename = 'appointments'
  ) then
    create policy "Doctors can view their appointments"
    on public.appointments
    for select
    using (exists (select 1 from public.doctors d where d.id = appointments.doctor_id and d.profile_id = auth.uid()));
  end if;

  -- INSERT por paciente
  if not exists (
    select 1 from pg_policies where policyname = 'Patients can create their appointments' and tablename = 'appointments'
  ) then
    create policy "Patients can create their appointments"
    on public.appointments
    for insert
    with check (patient_id = auth.uid());
  end if;

  -- INSERT por médico (por exemplo, secretaria do consultório usando conta do médico)
  if not exists (
    select 1 from pg_policies where policyname = 'Doctors can create appointments for their patients' and tablename = 'appointments'
  ) then
    create policy "Doctors can create appointments for their patients"
    on public.appointments
    for insert
    with check (exists (select 1 from public.doctors d where d.id = appointments.doctor_id and d.profile_id = auth.uid()));
  end if;

  -- UPDATE/DELETE por paciente
  if not exists (
    select 1 from pg_policies where policyname = 'Patients can update their appointments' and tablename = 'appointments'
  ) then
    create policy "Patients can update their appointments"
    on public.appointments
    for update
    using (patient_id = auth.uid())
    with check (patient_id = auth.uid());
  end if;

  -- UPDATE/DELETE por médico
  if not exists (
    select 1 from pg_policies where policyname = 'Doctors can update their appointments' and tablename = 'appointments'
  ) then
    create policy "Doctors can update their appointments"
    on public.appointments
    for update
    using (exists (select 1 from public.doctors d where d.id = appointments.doctor_id and d.profile_id = auth.uid()))
    with check (exists (select 1 from public.doctors d where d.id = appointments.doctor_id and d.profile_id = auth.uid()));
  end if;
end $$;

-- 6) Views públicas simples
create or replace view public.public_doctors as
select 
  d.id,
  d.specialty_id,
  e.nome as specialty_name, -- usando coluna existente 'nome'
  d.bio
from public.doctors d
left join public.especialidades_medicas e on e.id = d.specialty_id;

create or replace view public.public_locations as
select 
  l.id,
  l.name,
  l.city,
  l.state
from public.locations l;

-- 7) Audit logs (mínimo viável) e triggers em appointments
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  action public.audit_action not null,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  ip_address inet,
  user_agent text,
  timestamp timestamptz not null default now()
);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_logs (table_name, action, old_data, new_data, user_id, ip_address, user_agent)
  values (
    tg_relname,
    case when tg_op = 'INSERT' then 'insert'
         when tg_op = 'UPDATE' then 'update'
         when tg_op = 'DELETE' then 'delete' end,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end,
    auth.uid(),
    nullif(current_setting('request.headers', true)::jsonb->>'x-forwarded-for','')::inet,
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
  return coalesce(new, old);
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_audit_appointments') then
    create trigger trg_audit_appointments
    after insert or update or delete on public.appointments
    for each row execute function public.audit_trigger();
  end if;
end $$;

-- 8) Migração de dados (conservadora)
-- 8.1) medicos -> doctors
insert into public.doctors (profile_id, crm_number, specialty_id, bio)
select 
  m.user_id as profile_id,
  m.crm as crm_number,
  (
    select e.id 
    from public.especialidades_medicas e
    where e.nome = (
      select (jsonb_array_elements_text(m.especialidades) limit 1)
    )
    limit 1
  ) as specialty_id,
  null::text as bio
from public.medicos m
on conflict (profile_id) do nothing;

-- 8.2) locais_atendimento -> locations
insert into public.locations (doctor_id, name, address, city, state, zip_code, phone, whatsapp, status)
select 
  d.id as doctor_id,
  la.nome_local as name,
  coalesce(la.endereco_completo, la.endereco::text) as address,
  coalesce(la.cidade, '') as city,
  coalesce(la.estado, '') as state,
  la.cep as zip_code,
  la.telefone as phone,
  la.whatsapp as whatsapp,
  case 
    when la.status in ('ativo','temporariamente_fechado','manutencao') then la.status::public.location_status
    else 'ativo'::public.location_status
  end as status
from public.locais_atendimento la
join public.doctors d on d.profile_id = la.medico_id
on conflict do nothing;

-- 8.3) consultas -> appointments (status: 'agendada'/'confirmada' -> confirmed, 'cancelada' -> canceled, outros -> pending)
insert into public.appointments (patient_id, doctor_id, location_id, start_time, end_time, status, notes)
select 
  c.paciente_id as patient_id,
  d.id as doctor_id,
  (
    select l.id
    from public.locations l
    where l.doctor_id = d.id
    limit 1
  ) as location_id,
  c.consultation_date as start_time,
  c.consultation_date + interval '30 minutes' as end_time,
  case 
    when c.status in ('agendada','confirmada') then 'confirmed'::public.appointment_status
    when c.status in ('cancelada') then 'canceled'::public.appointment_status
    else 'pending'::public.appointment_status
  end as status,
  c.notes
from public.consultas c
join public.doctors d on d.profile_id = c.medico_id
where c.consultation_date is not null
on conflict do nothing;

-- 9) Validações rápidas (SAFE SELECTs para conferência)
-- Contadores (não interrompem a transação)
-- select 'doctors' as tabela, count(*) from public.doctors;
-- select 'locations' as tabela, count(*) from public.locations;
-- select 'schedules' as tabela, count(*) from public.schedules;
-- select 'appointments' as tabela, count(*) from public.appointments;

commit;
