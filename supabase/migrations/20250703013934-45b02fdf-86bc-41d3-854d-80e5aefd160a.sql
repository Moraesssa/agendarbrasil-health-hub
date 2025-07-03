-- Remover as políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "Médicos podem ver reembolsos de suas consultas refund" ON public.pagamentos;
DROP POLICY IF EXISTS "Médicos podem criar registros de reembolso" ON public.pagamentos;

-- As políticas existentes já são suficientes para o funcionamento:
-- "Médicos podem ver os pagamentos de suas consultas" - permite que médicos vejam pagamentos onde medico_id = auth.uid()
-- "Pacientes podem ver seus próprios pagamentos" - permite que pacientes vejam pagamentos onde paciente_id = auth.uid()  
-- "Usuários autenticados podem criar pagamentos" - permite inserir pagamentos onde paciente_id = auth.uid()

-- Não precisamos de políticas adicionais pois:
-- 1. Médicos já podem ver todos os pagamentos (incluindo reembolsos) das suas consultas via medico_id
-- 2. A inserção de reembolsos pode ser feita via service role key na edge function, sem depender das políticas RLS