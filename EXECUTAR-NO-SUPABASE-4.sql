-- SCRIPT 4: CORRIGIR FUNÇÃO get_doctors_by_location_and_specialty
-- Esta função deve retornar médicos baseado na especialidade e localização

-- Primeiro, vamos testar a função atual
SELECT 'Testando função atual...' as status;
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', 'Belo Horizonte', 'MG');

-- Verificar se há médicos com essa combinação manualmente
SELECT 'Verificação manual...' as status;
SELECT 
    p.display_name,
    m.crm,
    m.especialidades,
    la.nome_local,
    la.cidade,
    la.estado
FROM public.medicos m
JOIN public.profiles p ON m.user_id = p.id
JOIN public.locais_atendimento la ON m.user_id = la.medico_id
WHERE 'Cardiologia' = ANY(m.especialidades)
AND la.cidade = 'Belo Horizonte'
AND la.estado = 'MG';

-- Dropar e recriar a função get_doctors_by_location_and_specialty
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(text, text, text);

CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_specialty text,
    p_city text,
    p_state text
)
RETURNS TABLE(
    id uuid,
    display_name text,
    crm text,
    especialidades text[],
    local_nome text,
    local_cidade text,
    local_estado text,
    local_endereco jsonb,
    local_telefone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id as id,
        p.display_name,
        m.crm,
        m.especialidades,
        la.nome_local as local_nome,
        la.cidade as local_cidade,
        la.estado as local_estado,
        la.endereco as local_endereco,
        la.telefone as local_telefone
    FROM public.medicos m
    JOIN public.profiles p ON m.user_id = p.id
    JOIN public.locais_atendimento la ON m.user_id = la.medico_id
    WHERE p_specialty = ANY(m.especialidades)
    AND la.cidade = p_city
    AND la.estado = p_state
    ORDER BY p.display_name;
END;
$$;

-- Testar a função corrigida
SELECT 'Testando função corrigida...' as status;
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', 'Belo Horizonte', 'MG');
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', 'São Paulo', 'SP');
SELECT * FROM get_doctors_by_location_and_specialty('Pediatria', 'Belo Horizonte', 'MG');