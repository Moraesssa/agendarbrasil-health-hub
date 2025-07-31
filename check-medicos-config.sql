-- Script para verificar configurações dos médicos
SELECT 
  m.user_id,
  m.configuracoes,
  COUNT(la.id) as locais_count
FROM medicos m
LEFT JOIN locais_atendimento la ON la.medico_id = m.user_id AND la.ativo = true
GROUP BY m.user_id, m.configuracoes
LIMIT 10;

-- Verificar se há médicos com horários configurados
SELECT 
  user_id,
  configuracoes->'horarioAtendimento' as horarios,
  configuracoes->'duracaoConsulta' as duracao
FROM medicos 
WHERE configuracoes IS NOT NULL
  AND configuracoes->'horarioAtendimento' IS NOT NULL
LIMIT 5;

-- Verificar locais de atendimento
SELECT 
  la.id,
  la.nome_local,
  la.medico_id,
  la.ativo,
  la.endereco
FROM locais_atendimento la
WHERE la.ativo = true
LIMIT 10;