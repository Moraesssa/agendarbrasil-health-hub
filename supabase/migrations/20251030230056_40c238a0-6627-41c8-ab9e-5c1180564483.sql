
-- CORREÇÃO COMPLETA: Dados + Função de Busca

-- 1. Corrigir dados existentes: popular cidade/estado a partir do endereco JSONB
UPDATE locais_atendimento 
SET 
  cidade = COALESCE(
    cidade, 
    endereco->>'cidade',
    CASE 
      WHEN endereco->>'uf' = 'DF' THEN 'Brasília'
      ELSE NULL
    END
  ),
  estado = COALESCE(
    estado,
    endereco->>'uf',
    endereco->>'estado'
  )
WHERE ativo = true 
AND (cidade IS NULL OR estado IS NULL)
AND endereco IS NOT NULL;

-- 2. Verificar e corrigir inconsistências de capitalização
UPDATE locais_atendimento
SET cidade = INITCAP(cidade)
WHERE cidade IS NOT NULL 
AND cidade != INITCAP(cidade);

-- 3. Dropar e recriar função de busca melhorada
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(text, text, text);

CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_specialty text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_state text DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    display_name text,
    crm text,
    especialidades jsonb,
    local_nome text,
    local_cidade text,
    local_estado text,
    local_endereco jsonb,
    local_telefone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (m.user_id)
        m.user_id as id,
        p.display_name,
        m.crm,
        m.especialidades,
        la.nome_local as local_nome,
        la.cidade as local_cidade,
        la.estado as local_estado,
        la.endereco as local_endereco,
        la.telefone as local_telefone
    FROM medicos m
    JOIN profiles p ON m.user_id = p.id
    JOIN locais_atendimento la ON m.user_id = la.medico_id
    WHERE m.is_active = true
      AND la.ativo = true
      AND la.cidade IS NOT NULL
      AND la.estado IS NOT NULL
      -- Filtros opcionais com match case-insensitive
      AND (p_specialty IS NULL OR m.especialidades::jsonb ? p_specialty)
      AND (p_state IS NULL OR la.estado ILIKE p_state)
      AND (p_city IS NULL OR la.cidade ILIKE p_city)
    ORDER BY m.user_id, la.id;
END;
$$;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(text, text, text) TO anon;

-- 5. Adicionar comentário
COMMENT ON FUNCTION public.get_doctors_by_location_and_specialty(text, text, text) 
IS 'Busca médicos por especialidade e localização com filtros opcionais e case-insensitive. Retorna apenas médicos com dados de localização completos.';

-- 6. Testar a função corrigida
SELECT 'Teste 1: Busca com todos os filtros' as teste;
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', 'Itajubá', 'MG');

SELECT 'Teste 2: Busca apenas por especialidade' as teste;
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', NULL, NULL);

SELECT 'Teste 3: Busca por estado' as teste;
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', NULL, 'MG');

SELECT 'Teste 4: Verificar dados corrigidos' as teste;
SELECT 
    la.medico_id,
    la.nome_local,
    la.cidade,
    la.estado,
    la.endereco->>'cidade' as endereco_cidade,
    la.endereco->>'uf' as endereco_uf
FROM locais_atendimento la
WHERE la.ativo = true
ORDER BY la.id;
