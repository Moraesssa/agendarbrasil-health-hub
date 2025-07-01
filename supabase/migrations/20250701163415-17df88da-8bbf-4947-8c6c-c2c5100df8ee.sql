
-- Adicionar política RLS para permitir que pacientes vejam locais ativos para fins de agendamento
CREATE POLICY "Pacientes podem ver locais ativos para agendamento" 
ON public.locais_atendimento 
FOR SELECT 
USING (ativo = true);

-- Verificar se existe política similar para médicos e ajustar se necessário
-- Esta política permite que qualquer usuário autenticado veja locais ativos
-- o que é necessário para o sistema de agendamento funcionar
