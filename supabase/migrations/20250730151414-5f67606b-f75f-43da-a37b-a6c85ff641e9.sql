-- Correção das políticas RLS para permitir acesso aos horários

-- 1. Remover política problemática
DROP POLICY IF EXISTS "Public can view basic doctor data for scheduling" ON public.medicos;

-- 2. Criar política mais permissiva para agendamento
CREATE POLICY "Allow authenticated users to view doctor data for scheduling" 
ON public.medicos 
FOR SELECT 
USING (
  -- Médicos podem ver seus próprios dados
  auth.uid() = user_id 
  OR 
  -- Usuários autenticados podem ver dados básicos para agendamento
  auth.role() = 'authenticated'
);

-- 3. Verificar se RLS está habilitado na tabela locais_atendimento
ALTER TABLE public.locais_atendimento ENABLE ROW LEVEL SECURITY;

-- 4. Criar/atualizar política para locais_atendimento
DROP POLICY IF EXISTS "Pacientes podem ver locais ativos para agendamento" ON public.locais_atendimento;

CREATE POLICY "Allow authenticated users to view active locations" 
ON public.locais_atendimento 
FOR SELECT 
USING (
  -- Médicos podem ver seus próprios locais
  auth.uid() = medico_id 
  OR 
  -- Usuários autenticados podem ver locais ativos para agendamento
  (auth.role() = 'authenticated' AND ativo = true)
);

-- 5. Comentários para documentação
COMMENT ON POLICY "Allow authenticated users to view doctor data for scheduling" ON public.medicos 
IS 'Permite que usuários autenticados vejam dados básicos de médicos para agendamento';

COMMENT ON POLICY "Allow authenticated users to view active locations" ON public.locais_atendimento 
IS 'Permite que usuários autenticados vejam locais ativos para agendamento';