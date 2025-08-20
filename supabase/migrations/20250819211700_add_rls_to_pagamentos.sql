-- Adicionar políticas de RLS para a tabela de pagamentos

-- Habilitar RLS na tabela de pagamentos
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem, para garantir um estado limpo
DROP POLICY IF EXISTS "policy_select_pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "policy_all_pagamentos_service_role" ON public.pagamentos;

-- Política de SELECT: Pacientes e médicos podem ver os pagamentos das suas consultas
CREATE POLICY "policy_select_pagamentos"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.consultas
    WHERE consultas.id = pagamentos.consulta_id
    AND (
      consultas.paciente_id = auth.uid() OR
      consultas.medico_id = auth.uid()
    )
  )
);

-- Política de Acesso Total para service_role: Permite que o backend gerencie os pagamentos
CREATE POLICY "policy_all_pagamentos_service_role"
ON public.pagamentos
FOR ALL
TO service_role
USING (true);

-- Comentários para documentação
COMMENT ON POLICY "policy_select_pagamentos" ON public.pagamentos IS 'Pacientes e médicos podem visualizar os pagamentos associados às suas próprias consultas.';
COMMENT ON POLICY "policy_all_pagamentos_service_role" ON public.pagamentos IS 'Permite que o backend (service_role) tenha acesso total para gerenciar todos os pagamentos.';
