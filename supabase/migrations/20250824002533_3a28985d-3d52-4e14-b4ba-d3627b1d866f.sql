
BEGIN;

-- 1) Tipos (Enums) necessários
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE public.appointment_status AS ENUM ('pending','agendada','confirmada','cancelada');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_status') THEN
    CREATE TYPE public.location_status AS ENUM ('ativo','temporariamente_fechado','manutencao');
  END IF;
END$$;

-- 2) Tabelas canônicas (não conflitam com as existentes)
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  crm_number text NOT NULL,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.doctor_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES public.especialidades_medicas(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_doctor_specialty ON public.doctor_specialties(doctor_id, specialty_id);

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  latitude double precision,
  longitude double precision,
  phone text,
  whatsapp text,
  status public.location_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_latitude_range CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
  CONSTRAINT chk_longitude_range CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180))
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration int NOT NULL DEFAULT 30,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Log canônico simples (consulta apenas por admins)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  ip_address inet,
  user_agent text,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);

-- 3) Índices
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_start ON public.appointments(doctor_id, start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_doctor_day ON public.schedules(doctor_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_doctors_profile ON public.doctors(profile_id);

-- 4) Triggers de updated_at (reutiliza função existente public.handle_updated_at)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_doctors_updated_at') THEN
    CREATE TRIGGER tg_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_locations_updated_at') THEN
    CREATE TRIGGER tg_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_schedules_updated_at') THEN
    CREATE TRIGGER tg_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_appointments_updated_at') THEN
    CREATE TRIGGER tg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- 5) Trigger de prevenção de overbooking
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.doctor_id = NEW.doctor_id
      AND a.status IN ('pending','agendada','confirmada')
      AND tstzrange(a.start_time, a.end_time, '[)') && tstzrange(NEW.start_time, NEW.end_time, '[)')
  ) THEN
    RAISE EXCEPTION 'Horário já ocupado';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_appointments_no_overlap') THEN
    CREATE TRIGGER tg_appointments_no_overlap
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();
  END IF;
END$$;

-- 6) Auditoria básica em appointments
CREATE OR REPLACE FUNCTION public.audit_to_audit_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, action, old_data, new_data, user_id, ip_address, user_agent)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_audit_appointments') THEN
    CREATE TRIGGER tg_audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.audit_to_audit_logs();
  END IF;
END$$;

-- 7) Views públicas (herdam políticas das tabelas-base; não se aplica RLS diretamente em views)
CREATE OR REPLACE VIEW public.public_doctors AS
SELECT d.id, d.crm_number, p.display_name AS name
FROM public.doctors d
JOIN public.profiles p ON p.id = d.profile_id;

CREATE OR REPLACE VIEW public.public_locations AS
SELECT l.id, l.name, l.city, l.state, l.status, l.doctor_id
FROM public.locations l;

-- 8) RLS: ativar e políticas seguras
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- doctors
CREATE POLICY doctors_public_select ON public.doctors
FOR SELECT USING (true);

CREATE POLICY doctors_owner_insert ON public.doctors
FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY doctors_owner_update ON public.doctors
FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY doctors_owner_delete ON public.doctors
FOR DELETE USING (auth.uid() = profile_id);

-- doctor_specialties
CREATE POLICY doctor_specialties_public_select ON public.doctor_specialties
FOR SELECT USING (true);

CREATE POLICY doctor_specialties_owner_insert ON public.doctor_specialties
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

CREATE POLICY doctor_specialties_owner_update ON public.doctor_specialties
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

CREATE POLICY doctor_specialties_owner_delete ON public.doctor_specialties
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

-- locations
CREATE POLICY locations_public_select ON public.locations
FOR SELECT USING (true);

CREATE POLICY locations_owner_all ON public.locations
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

-- schedules
CREATE POLICY schedules_public_select ON public.schedules
FOR SELECT USING (true);

CREATE POLICY schedules_owner_all ON public.schedules
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

-- appointments
CREATE POLICY appointments_patient_or_doctor_select ON public.appointments
FOR SELECT USING (
  auth.uid() = patient_id OR
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

CREATE POLICY appointments_patient_or_doctor_insert ON public.appointments
FOR INSERT WITH CHECK (
  auth.uid() = patient_id OR
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

CREATE POLICY appointments_patient_or_doctor_update ON public.appointments
FOR UPDATE USING (
  auth.uid() = patient_id OR
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid())
);

-- audit_logs
CREATE POLICY audit_logs_admin_select ON public.audit_logs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin')
);

CREATE POLICY audit_logs_insert_any_auth ON public.audit_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 9) Migração de dados do schema atual para o novo

-- Doctors a partir de medicos
INSERT INTO public.doctors (profile_id, crm_number, bio)
SELECT m.user_id, m.crm, COALESCE(m.dados_profissionais->>'bio', NULL)
FROM public.medicos m
LEFT JOIN public.doctors d ON d.profile_id = m.user_id
WHERE d.id IS NULL;

-- Especialidades (medicos.especialidades -> doctor_specialties)
INSERT INTO public.doctor_specialties (doctor_id, specialty_id)
SELECT d.id, e.id
FROM public.medicos m
JOIN public.doctors d ON d.profile_id = m.user_id
JOIN LATERAL (
  SELECT trim(x::text, '"') AS nome
  FROM jsonb_array_elements_text(m.especialidades) AS x
) s ON true
JOIN public.especialidades_medicas e ON e.nome = s.nome
ON CONFLICT (doctor_id, specialty_id) DO NOTHING;

-- Locations a partir de locais_atendimento
INSERT INTO public.locations (doctor_id, name, address, city, state, zip_code, phone, whatsapp, status, latitude, longitude)
SELECT d.id,
       la.nome_local,
       COALESCE(la.endereco_completo, la.endereco->>'endereco_completo'),
       la.cidade,
       la.estado,
       la.cep,
       la.telefone,
       la.whatsapp,
       CASE
         WHEN la.status IN ('ativo','temporariamente_fechado','manutencao') THEN la.status::public.location_status
         ELSE 'ativo'::public.location_status
       END,
       NULLIF(la.coordenadas->>'lat','')::double precision,
       NULLIF(la.coordenadas->>'lng','')::double precision
FROM public.locais_atendimento la
JOIN public.doctors d ON d.profile_id = la.medico_id
LEFT JOIN public.locations l ON l.name = la.nome_local AND l.doctor_id = d.id
WHERE l.id IS NULL;

-- Appointments a partir de consultas
INSERT INTO public.appointments (patient_id, doctor_id, location_id, start_time, end_time, status, notes)
SELECT
  c.paciente_id,
  d.id,
  NULL::uuid,
  c.consultation_date,
  c.consultation_date + interval '30 minutes',
  CASE
    WHEN c.status IN ('agendada','confirmada') THEN c.status::public.appointment_status
    WHEN c.status = 'cancelada' THEN 'cancelada'::public.appointment_status
    ELSE 'pending'::public.appointment_status
  END,
  c.notes
FROM public.consultas c
JOIN public.doctors d ON d.profile_id = c.medico_id
LEFT JOIN public.appointments a
  ON a.doctor_id = d.id
 AND a.start_time = c.consultation_date
 AND a.patient_id = c.paciente_id
WHERE c.consultation_date IS NOT NULL
  AND a.id IS NULL;

-- 10) Função utilitária para limpeza de logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_old int DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE deleted_count integer;
BEGIN
  DELETE FROM public.audit_logs WHERE "timestamp" < now() - make_interval(days => GREATEST(1, days_old));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMIT;
