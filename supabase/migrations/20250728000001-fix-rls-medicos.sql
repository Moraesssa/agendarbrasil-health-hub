-- Corrigir política RLS da tabela medicos para permitir acesso adequado
-- Esta correção permite que pacientes vejam dados básicos de médicos para agendamento

-- Remover política problemática
DROP POLICY IF EXISTS "Medicos can view public doctor data" ON public.medicos;

-- Criar política mais permissiva para dados públicos de médicos
CREATE POLICY "Public can view basic doctor data for scheduling" 
ON public.medicos 
FOR SELECT 
USING (
  -- Médicos podem ver seus próprios dados
  auth.uid() = user_id 
  OR 
  -- Usuários autenticados podem ver dados básicos para agendamento
  (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('paciente', 'medico')
    )
  )
);

-- Adicionar comentário explicativo
COMMENT ON POLICY "Public can view basic doctor data for scheduling" ON public.medicos 
IS 'Permite que pacientes vejam dados básicos de médicos para funcionalidades de agendamento';