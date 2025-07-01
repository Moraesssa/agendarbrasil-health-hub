
-- Criar índice único composto para prevenir agendamentos duplicados no mesmo horário
-- Considera medico_id + data_consulta para consultas ativas (agendada ou confirmada)
CREATE UNIQUE INDEX idx_consultas_unique_slot 
ON consultas (medico_id, data_consulta) 
WHERE status IN ('agendada', 'confirmada');

-- Adicionar comentário explicativo
COMMENT ON INDEX idx_consultas_unique_slot IS 'Previne agendamentos duplicados no mesmo horário para o mesmo médico';
