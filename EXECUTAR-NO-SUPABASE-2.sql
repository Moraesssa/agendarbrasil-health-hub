-- SCRIPT 2: CORRIGIR DADOS DOS LOCAIS (CIDADE/ESTADO)
-- Copie e execute este código no Supabase SQL Editor APÓS o script 1

-- Atualizar locais sem cidade/estado baseado no CRM dos médicos
UPDATE public.locais_atendimento 
SET 
    cidade = CASE 
        WHEN m.crm LIKE '%MG%' OR m.crm LIKE '%mg%' THEN 'Belo Horizonte'
        WHEN m.crm LIKE '%SP%' OR m.crm LIKE '%sp%' THEN 'São Paulo'
        WHEN m.crm LIKE '%SC%' OR m.crm LIKE '%sc%' THEN 'Florianópolis'
        WHEN m.crm LIKE '%AM%' OR m.crm LIKE '%am%' THEN 'Manaus'
        ELSE 'Brasília'
    END,
    estado = CASE 
        WHEN m.crm LIKE '%MG%' OR m.crm LIKE '%mg%' THEN 'MG'
        WHEN m.crm LIKE '%SP%' OR m.crm LIKE '%sp%' THEN 'SP'
        WHEN m.crm LIKE '%SC%' OR m.crm LIKE '%sc%' THEN 'SC'
        WHEN m.crm LIKE '%AM%' OR m.crm LIKE '%am%' THEN 'AM'
        ELSE 'DF'
    END
FROM public.medicos m
WHERE public.locais_atendimento.medico_id = m.user_id
AND (public.locais_atendimento.cidade IS NULL OR public.locais_atendimento.estado IS NULL);

-- Verificar se os dados foram atualizados
SELECT 
    la.nome_local,
    la.cidade,
    la.estado,
    m.crm,
    m.especialidades
FROM public.locais_atendimento la
JOIN public.medicos m ON la.medico_id = m.user_id
ORDER BY la.cidade, la.nome_local;