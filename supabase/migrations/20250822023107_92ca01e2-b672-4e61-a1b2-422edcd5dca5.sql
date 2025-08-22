-- PHASE 1: Data & Structure Correction (step by step approach)
-- 1) Drop conflicting function and create indexes
DROP FUNCTION IF EXISTS public.get_available_cities(text);

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

-- 5) Data hygiene: ensure medicos.especialidades is a JSONB array
UPDATE public.medicos
SET especialidades = to_jsonb(ARRAY[especialidades]::text[])
WHERE jsonb_typeof(especialidades) = 'string';

UPDATE public.medicos
SET especialidades = '[]'::jsonb
WHERE especialidades IS NULL;

-- 6) Ensure updated_at triggers on core tables
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