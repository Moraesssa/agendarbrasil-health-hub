-- SCRIPT 3: CORRIGIR FUNÇÃO get_available_cities
-- Esta função deve retornar as cidades onde realmente há médicos

-- Primeiro, vamos ver o que a função atual está fazendo
SELECT 'Testando função atual...' as status;
SELECT * FROM get_available_cities('MG');

-- Verificar quais cidades realmente têm médicos em MG
SELECT 'Cidades com médicos em MG...' as status;
SELECT DISTINCT 
    la.cidade,
    la.estado,
    COUNT(*) as total_medicos
FROM public.locais_atendimento la
JOIN public.medicos m ON la.medico_id = m.user_id
WHERE la.estado = 'MG'
GROUP BY la.cidade, la.estado
ORDER BY la.cidade;

-- Verificar todas as cidades com médicos por estado
SELECT 'Todas as cidades com médicos...' as status;
SELECT 
    la.estado,
    la.cidade,
    COUNT(*) as total_medicos,
    array_agg(DISTINCT m.especialidades[1]) as especialidades
FROM public.locais_atendimento la
JOIN public.medicos m ON la.medico_id = m.user_id
WHERE la.cidade IS NOT NULL AND la.estado IS NOT NULL
GROUP BY la.estado, la.cidade
ORDER BY la.estado, la.cidade;

-- Dropar a função existente primeiro
DROP FUNCTION IF EXISTS public.get_available_cities(text);

-- Recriar a função get_available_cities para retornar cidades reais
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text, estado text, total_medicos bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        la.cidade,
        la.estado,
        COUNT(*) as total_medicos
    FROM public.locais_atendimento la
    JOIN public.medicos m ON la.medico_id = m.user_id
    WHERE la.estado = state_uf
    AND la.cidade IS NOT NULL
    AND la.estado IS NOT NULL
    GROUP BY la.cidade, la.estado
    ORDER BY la.cidade;
END;
$$;

-- Testar a função corrigida
SELECT 'Testando função corrigida...' as status;
SELECT * FROM get_available_cities('MG');
SELECT * FROM get_available_cities('SP');
SELECT * FROM get_available_cities('SC');
SELECT * FROM get_available_cities('AM');