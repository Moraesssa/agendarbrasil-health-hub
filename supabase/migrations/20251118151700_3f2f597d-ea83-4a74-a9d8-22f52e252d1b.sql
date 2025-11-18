-- =====================================================================
-- CORREÇÕES CRÍTICAS: RLS, HORÁRIOS_DISPONIBILIDADE E USER_TYPES
-- =====================================================================

-- =====================================================================
-- 1. CORREÇÕES DE RLS (ROW LEVEL SECURITY)
-- =====================================================================

-- Habilitar RLS nas tabelas críticas que não têm
ALTER TABLE IF EXISTS public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medical_prescriptions ENABLE ROW LEVEL SECURITY;

-- Criar policies básicas para integration_logs (apenas service role)
DROP POLICY IF EXISTS "integration_logs_service_role" ON public.integration_logs;
CREATE POLICY "integration_logs_service_role" 
ON public.integration_logs 
FOR ALL 
USING (current_setting('role'::text, true) = 'service_role'::text);

-- Criar policies para medical_prescriptions
DROP POLICY IF EXISTS "Prescrições: paciente visualiza suas" ON public.medical_prescriptions;
CREATE POLICY "Prescrições: paciente visualiza suas" 
ON public.medical_prescriptions 
FOR SELECT 
USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Prescrições: médico cria e visualiza" ON public.medical_prescriptions;
CREATE POLICY "Prescrições: médico cria e visualiza" 
ON public.medical_prescriptions 
FOR ALL 
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

-- =====================================================================
-- 2. POPULAR HORÁRIOS_DISPONIBILIDADE COM DADOS DE TESTE
-- =====================================================================

-- Criar horários padrão para todos os médicos ativos (Segunda a Sexta, 8h-18h)
INSERT INTO public.horarios_disponibilidade (
  medico_id,
  dia_semana,
  hora_inicio,
  hora_fim,
  intervalo_minutos,
  tipo_consulta,
  ativo,
  data_inicio,
  local_id
)
SELECT 
  m.user_id,
  dia.dia_semana,
  '08:00'::time,
  '18:00'::time,
  30,
  'presencial',
  true,
  CURRENT_DATE,
  (SELECT id FROM public.locais_atendimento WHERE medico_id = m.user_id AND ativo = true LIMIT 1)
FROM public.medicos m
CROSS JOIN (
  SELECT 1 AS dia_semana UNION ALL  -- Segunda
  SELECT 2 UNION ALL                 -- Terça
  SELECT 3 UNION ALL                 -- Quarta
  SELECT 4 UNION ALL                 -- Quinta
  SELECT 5                           -- Sexta
) AS dia
WHERE m.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.horarios_disponibilidade hd
    WHERE hd.medico_id = m.user_id 
      AND hd.dia_semana = dia.dia_semana
  )
ON CONFLICT DO NOTHING;

-- Criar também horários de teleconsulta para médicos que aceitam
INSERT INTO public.horarios_disponibilidade (
  medico_id,
  dia_semana,
  hora_inicio,
  hora_fim,
  intervalo_minutos,
  tipo_consulta,
  ativo,
  data_inicio
)
SELECT 
  m.user_id,
  dia.dia_semana,
  '09:00'::time,
  '17:00'::time,
  30,
  'teleconsulta',
  true,
  CURRENT_DATE
FROM public.medicos m
CROSS JOIN (
  SELECT 1 AS dia_semana UNION ALL
  SELECT 2 UNION ALL
  SELECT 3 UNION ALL
  SELECT 4 UNION ALL
  SELECT 5
) AS dia
WHERE m.is_active = true
  AND m.aceita_teleconsulta = true
  AND NOT EXISTS (
    SELECT 1 FROM public.horarios_disponibilidade hd
    WHERE hd.medico_id = m.user_id 
      AND hd.dia_semana = dia.dia_semana
      AND hd.tipo_consulta = 'teleconsulta'
  )
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 3. CORRIGIR USER_TYPES NOS PROFILES
-- =====================================================================

-- Atualizar profiles que têm registro em medicos mas não têm user_type
UPDATE public.profiles p
SET user_type = 'medico',
    updated_at = NOW()
WHERE p.user_type IS NULL
  AND EXISTS (
    SELECT 1 FROM public.medicos m 
    WHERE m.user_id = p.id
  );

-- Atualizar profiles que têm registro em pacientes mas não têm user_type
UPDATE public.profiles p
SET user_type = 'paciente',
    updated_at = NOW()
WHERE p.user_type IS NULL
  AND EXISTS (
    SELECT 1 FROM public.pacientes pac 
    WHERE pac.user_id = p.id
  );

-- Para profiles órfãos (sem registro em medicos nem pacientes), definir como paciente por padrão
UPDATE public.profiles p
SET user_type = 'paciente',
    updated_at = NOW()
WHERE p.user_type IS NULL;

-- =====================================================================
-- 4. CORRIGIR SEARCH_PATH NAS FUNÇÕES CRÍTICAS
-- =====================================================================

-- Recriar função get_available_states com search_path correto
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf text, nome text)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT DISTINCT 
        la.estado as uf,
        la.estado as nome
    FROM public.locais_atendimento la
    JOIN public.medicos m ON m.user_id = la.medico_id
    JOIN public.profiles p ON p.id = m.user_id
    WHERE la.ativo = true 
        AND la.status = 'ativo'
        AND la.estado IS NOT NULL
        AND la.estado != ''
        AND p.user_type = 'medico'
        AND p.is_active = true
    ORDER BY la.estado;
$$;

-- Recriar função get_available_cities com search_path correto
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text, estado text, total_medicos bigint)
LANGUAGE sql
STABLE 
SECURITY DEFINER
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
        AND la.status = 'ativo'
        AND la.cidade IS NOT NULL
        AND la.cidade != ''
        AND (state_uf IS NULL OR la.estado = state_uf)
        AND p.user_type = 'medico'
        AND p.is_active = true
    GROUP BY la.cidade, la.estado
    ORDER BY la.cidade;
$$;

-- =====================================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================================

-- Verificar resultados
DO $$
DECLARE
  horarios_count INTEGER;
  profiles_sem_tipo INTEGER;
  estados_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO horarios_count FROM public.horarios_disponibilidade;
  SELECT COUNT(*) INTO profiles_sem_tipo FROM public.profiles WHERE user_type IS NULL;
  SELECT COUNT(*) INTO estados_count FROM public.get_available_states();
  
  RAISE NOTICE '✅ Horários disponibilidade criados: %', horarios_count;
  RAISE NOTICE '✅ Profiles sem user_type restantes: %', profiles_sem_tipo;
  RAISE NOTICE '✅ Estados disponíveis: %', estados_count;
END $$;