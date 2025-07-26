
-- Corrigir a política RLS da tabela medicos para que médicos só vejam seus próprios dados
DROP POLICY IF EXISTS "Medicos can view own data" ON public.medicos;

CREATE POLICY "Medicos can view own data" 
ON public.medicos 
FOR SELECT 
USING (auth.uid() = user_id);

-- Adicionar política para permitir que médicos vejam dados de outros médicos apenas para funcionalidades específicas (como busca)
CREATE POLICY "Medicos can view public doctor data" 
ON public.medicos 
FOR SELECT 
USING (
  -- Permite ver dados básicos de outros médicos para funcionalidades de busca/agendamento
  auth.role() = 'authenticated' AND (
    -- Dados próprios sempre permitidos
    auth.uid() = user_id OR 
    -- Ou dados públicos para pacientes que precisam ver médicos
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'paciente'
    )
  )
);
