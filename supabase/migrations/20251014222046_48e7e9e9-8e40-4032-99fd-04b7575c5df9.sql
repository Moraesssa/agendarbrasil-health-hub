-- ========================================
-- ETAPA 1: REFORMULAÇÃO COMPLETA - CORREÇÃO DE CONSTRAINTS
-- ========================================

-- 1. ADICIONAR UNIQUE CONSTRAINT em medicos.user_id (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'medicos_user_id_key' 
    AND conrelid = 'public.medicos'::regclass
  ) THEN
    ALTER TABLE public.medicos ADD CONSTRAINT medicos_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 2. CRIAR TABELA horarios_disponibilidade
CREATE TABLE IF NOT EXISTS public.horarios_disponibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES public.medicos(user_id) ON DELETE CASCADE,
  local_id BIGINT REFERENCES public.locais_atendimento(id) ON DELETE SET NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  tipo_consulta TEXT NOT NULL CHECK (tipo_consulta IN ('presencial', 'teleconsulta')),
  intervalo_minutos INTEGER NOT NULL DEFAULT 30,
  data_inicio DATE,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_horarios_medico_dia ON public.horarios_disponibilidade(medico_id, dia_semana, ativo);
CREATE INDEX IF NOT EXISTS idx_horarios_local ON public.horarios_disponibilidade(local_id);

-- 3. BACKFILL especialidades
UPDATE public.medicos m
SET especialidades = COALESCE(
  CASE 
    WHEN especialidades IS NULL OR jsonb_typeof(especialidades) != 'array' THEN '["Cardiologia"]'::jsonb
    WHEN NOT especialidades ? 'Cardiologia' THEN especialidades || '["Cardiologia"]'::jsonb
    ELSE especialidades
  END,
  '["Cardiologia"]'::jsonb
)
WHERE m.user_id IN (
  SELECT DISTINCT la.medico_id 
  FROM public.locais_atendimento la 
  WHERE la.cidade = 'Itajubá' AND la.estado = 'MG'
);

-- 4. HABILITAR RLS
ALTER TABLE public."Usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Medicos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pacientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Consultas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_disponibilidade ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS
DROP POLICY IF EXISTS "Usuarios: usuário vê próprio registro" ON public."Usuarios";
CREATE POLICY "Usuarios: usuário vê próprio registro"
  ON public."Usuarios" FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Medicos: médico gerencia próprio perfil" ON public."Medicos";
DROP POLICY IF EXISTS "Medicos: visualização pública de ativos" ON public."Medicos";
CREATE POLICY "Medicos: médico gerencia próprio perfil"
  ON public."Medicos" FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Medicos: visualização pública de ativos"
  ON public."Medicos" FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Pacientes: paciente gerencia próprio perfil" ON public."Pacientes";
CREATE POLICY "Pacientes: paciente gerencia próprio perfil"
  ON public."Pacientes" FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Consultas: paciente vê suas consultas" ON public."Consultas";
DROP POLICY IF EXISTS "Consultas: médico vê suas consultas" ON public."Consultas";
DROP POLICY IF EXISTS "Consultas: paciente cria consulta" ON public."Consultas";
CREATE POLICY "Consultas: paciente vê suas consultas"
  ON public."Consultas" FOR SELECT USING (auth.uid() = paciente_id);
CREATE POLICY "Consultas: médico vê suas consultas"
  ON public."Consultas" FOR SELECT USING (auth.uid() = medico_id);
CREATE POLICY "Consultas: paciente cria consulta"
  ON public."Consultas" FOR INSERT WITH CHECK (auth.uid() = paciente_id);

DROP POLICY IF EXISTS "Horarios: visualização pública" ON public.horarios_disponibilidade;
DROP POLICY IF EXISTS "Horarios: médico gerencia" ON public.horarios_disponibilidade;
CREATE POLICY "Horarios: visualização pública"
  ON public.horarios_disponibilidade FOR SELECT USING (ativo = true);
CREATE POLICY "Horarios: médico gerencia"
  ON public.horarios_disponibilidade FOR ALL
  USING (auth.uid() = medico_id)
  WITH CHECK (auth.uid() = medico_id);

-- 6. FUNÇÃO RPC
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
  p_specialty TEXT, p_state TEXT, p_city TEXT
)
RETURNS TABLE(
  id UUID, display_name TEXT, especialidades JSONB, crm TEXT,
  foto_perfil_url TEXT, rating NUMERIC, total_avaliacoes INTEGER,
  aceita_teleconsulta BOOLEAN, aceita_consulta_presencial BOOLEAN,
  valor_consulta_presencial NUMERIC, valor_consulta_teleconsulta NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT m.user_id, p.display_name, m.especialidades, m.crm,
    m.foto_perfil_url, m.rating, m.total_avaliacoes, m.aceita_teleconsulta,
    m.aceita_consulta_presencial, m.valor_consulta_presencial, m.valor_consulta_teleconsulta
  FROM public.medicos m
  INNER JOIN public.profiles p ON p.id = m.user_id
  INNER JOIN public.locais_atendimento la ON la.medico_id = m.user_id
  WHERE m.is_active = true AND p.is_active = true
    AND la.ativo = true AND la.status = 'ativo'
    AND (p_state IS NULL OR la.estado = p_state)
    AND (p_city IS NULL OR la.cidade = p_city)
    AND (p_specialty IS NULL OR (
      (m.especialidades IS NOT NULL AND m.especialidades ? p_specialty)
      OR (m.dados_profissionais->>'especialidade' = p_specialty)
      OR (m.dados_profissionais->'especialidades' ? p_specialty)
    ))
  ORDER BY m.rating DESC NULLS LAST, m.total_avaliacoes DESC NULLS LAST;
END;
$$;