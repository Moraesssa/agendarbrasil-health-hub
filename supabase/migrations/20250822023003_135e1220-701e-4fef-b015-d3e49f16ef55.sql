-- PHASE 1: Data & Structure Correction (fixed RLS column names)
-- 0) Prep: drop conflicting function to allow signature change
DROP FUNCTION IF EXISTS public.get_available_cities(text);

-- 1) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medicos_especialidades_gin ON public.medicos USING GIN (especialidades);
CREATE INDEX IF NOT EXISTS idx_locais_cidade ON public.locais_atendimento (cidade);
CREATE INDEX IF NOT EXISTS idx_locais_estado ON public.locais_atendimento (estado);
CREATE INDEX IF NOT EXISTS idx_locais_medico ON public.locais_atendimento (medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico_date ON public.consultas (medico_id, consultation_date);

-- 2) Foreign keys (NOT VALID to avoid breaking current data)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medicos_user_id_fkey') THEN
    ALTER TABLE public.medicos
    ADD CONSTRAINT medicos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locais_atendimento_medico_id_fkey') THEN
    ALTER TABLE public.locais_atendimento
    ADD CONSTRAINT locais_atendimento_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultas_medico_id_fkey') THEN
    ALTER TABLE public.consultas
    ADD CONSTRAINT consultas_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultas_paciente_id_fkey') THEN
    ALTER TABLE public.consultas
    ADD CONSTRAINT consultas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultas_paciente_familiar_id_fkey') THEN
    ALTER TABLE public.consultas
    ADD CONSTRAINT consultas_paciente_familiar_id_fkey FOREIGN KEY (paciente_familiar_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- 3) Fix RPC: get_doctors_by_location_and_specialty
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
  p_specialty text,
  p_city text,
  p_state text
)
RETURNS TABLE(id uuid, display_name text, especialidades jsonb, crm text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.user_id as id,
    p.display_name,
    m.especialidades,
    m.crm
  FROM public.medicos m
  JOIN public.profiles p ON p.id = m.user_id
  WHERE p.user_type = 'medico'
    AND p.is_active = true
    AND (
      p_specialty IS NULL OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(m.especialidades) AS e(val)
        WHERE e.val = p_specialty
      )
    )
    AND (
      (p_city IS NULL AND p_state IS NULL)
      OR EXISTS (
        SELECT 1 FROM public.locais_atendimento la
        WHERE la.medico_id = m.user_id
          AND la.ativo = true
          AND (p_city IS NULL OR la.cidade = p_city)
          AND (p_state IS NULL OR la.estado = p_state)
      )
    )
  ORDER BY p.display_name;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(text, text, text) TO anon, authenticated, service_role;

-- 4) Improve available states/cities RPCs
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf text, nome text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT 
    la.estado as uf,
    la.estado as nome
  FROM public.locais_atendimento la
  JOIN public.medicos m ON m.user_id = la.medico_id
  JOIN public.profiles p ON p.id = m.user_id
  WHERE la.ativo = true 
    AND p.user_type = 'medico'
    AND p.is_active = true
  ORDER BY la.estado;
$$;
GRANT EXECUTE ON FUNCTION public.get_available_states() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text, estado text, total_medicos bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    la.cidade,
    la.estado,
    COUNT(DISTINCT la.medico_id) as total_medicos
  FROM public.locais_atendimento la
  JOIN public.medicos m ON m.user_id = la.medico_id
  JOIN public.profiles p ON p.id = m.user_id
  WHERE la.ativo = true 
    AND (state_uf IS NULL OR la.estado = state_uf)
    AND p.user_type = 'medico'
    AND p.is_active = true
  GROUP BY la.cidade, la.estado
  ORDER BY la.cidade;
$$;
GRANT EXECUTE ON FUNCTION public.get_available_cities(text) TO anon, authenticated, service_role;

-- 5) Temporary reservations table + RLS + triggers
CREATE TABLE IF NOT EXISTS public.temporary_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  family_member_id uuid NULL,
  appointment_datetime timestamptz NOT NULL,
  specialty text NULL,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  notes text NULL
);

ALTER TABLE public.temporary_reservations ENABLE ROW LEVEL SECURITY;

-- Policies (using correct column names)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'temporary_reservations' AND policyname = 'Users can manage their own reservations'
  ) THEN
    CREATE POLICY "Users can manage their own reservations"
    ON public.temporary_reservations
    FOR ALL TO authenticated
    USING (auth.uid() = patient_id OR auth.uid() = COALESCE(family_member_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WITH CHECK (auth.uid() = patient_id OR auth.uid() = COALESCE(family_member_id, '00000000-0000-0000-0000-000000000000'::uuid));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'temporary_reservations' AND policyname = 'Doctors can view reservations for them'
  ) THEN
    CREATE POLICY "Doctors can view reservations for them"
    ON public.temporary_reservations
    FOR SELECT TO authenticated
    USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'temporary_reservations' AND policyname = 'Service role manage reservations'
  ) THEN
    CREATE POLICY "Service role manage reservations"
    ON public.temporary_reservations
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- FKs (NOT VALID)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_doctor_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_patient_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_family_member_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_family_member_id_fkey FOREIGN KEY (family_member_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- Triggers for updated_at and cleanup
DROP TRIGGER IF EXISTS trg_tr_updated_at ON public.temporary_reservations;
CREATE TRIGGER trg_tr_updated_at
BEFORE UPDATE ON public.temporary_reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tr_cleanup_expired ON public.temporary_reservations;
CREATE TRIGGER trg_tr_cleanup_expired
AFTER INSERT OR UPDATE OR DELETE ON public.temporary_reservations
FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_expired_reservations();

-- 6) Function to extend temporary reservations
CREATE OR REPLACE FUNCTION public.extend_temporary_reservation(p_session_id text, p_minutes integer DEFAULT 10)
RETURNS TABLE(success boolean, expires_at timestamptz, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_expires timestamptz;
BEGIN
  UPDATE public.temporary_reservations
  SET expires_at = now() + make_interval(mins => GREATEST(1, p_minutes)),
      updated_at = now()
  WHERE session_id = p_session_id
    AND status = 'active'
    AND expires_at > now()
  RETURNING expires_at INTO v_new_expires;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_new_expires, 'Reservation extended';
  ELSE
    RETURN QUERY SELECT FALSE, NULL::timestamptz, 'Reservation not found or expired';
  END IF;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.extend_temporary_reservation(text, integer) TO authenticated, service_role;

-- 7) Ensure updated_at triggers on core tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_consultas_updated_at'
  ) THEN
    CREATE TRIGGER trg_consultas_updated_at
    BEFORE UPDATE ON public.consultas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_medicos_updated_at'
  ) THEN
    CREATE TRIGGER trg_medicos_updated_at
    BEFORE UPDATE ON public.medicos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_locais_updated_at'
  ) THEN
    CREATE TRIGGER trg_locais_updated_at
    BEFORE UPDATE ON public.locais_atendimento
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 8) Data hygiene: ensure medicos.especialidades is a JSONB array
UPDATE public.medicos
SET especialidades = to_jsonb(ARRAY[especialidades]::text[])
WHERE jsonb_typeof(especialidades) = 'string';

UPDATE public.medicos
SET especialidades = '[]'::jsonb
WHERE especialidades IS NULL;

-- 9) Documentation
COMMENT ON TABLE public.temporary_reservations IS 'Temporary holds for appointment slots with expiration and RLS per user/doctor.';