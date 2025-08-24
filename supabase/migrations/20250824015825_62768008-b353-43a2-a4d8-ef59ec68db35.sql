-- CORREÇÃO CRÍTICA DO SISTEMA DE AGENDAMENTO - ETAPA 3
-- Corrigir funções RPC que estão falhando

-- Corrigir a função get_doctors_by_location_and_specialty
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(text, text, text);

CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_specialty text,
    p_city text,
    p_state text
)
RETURNS TABLE(
    id uuid,
    display_name text,
    especialidades jsonb,
    crm text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id as id,
        p.display_name,
        m.especialidades,
        m.crm
    FROM public.medicos m
    JOIN public.profiles p ON p.id = m.user_id
    JOIN public.locais_atendimento la ON la.medico_id = m.user_id
    WHERE p.user_type = 'medico'
        AND p.is_active = true
        AND la.ativo = true
        AND la.status = 'ativo'
        AND (
            p_specialty IS NULL OR 
            m.especialidades::jsonb ? p_specialty OR
            EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(m.especialidades) AS e(val)
                WHERE e.val = p_specialty
            )
        )
        AND (p_city IS NULL OR la.cidade = p_city)
        AND (p_state IS NULL OR la.estado = p_state)
    GROUP BY m.user_id, p.display_name, m.especialidades, m.crm
    ORDER BY p.display_name;
END;
$$;

-- Testar a função corrigida
SELECT 'Testando get_doctors_by_location_and_specialty:' as test;
SELECT * FROM get_doctors_by_location_and_specialty('Cardiologia', 'São Paulo', 'SP');
SELECT * FROM get_doctors_by_location_and_specialty(null, null, null);

-- Corrigir função get_available_states se necessário
DROP FUNCTION IF EXISTS public.get_available_states();

CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf text, nome text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT DISTINCT 
        la.estado as uf,
        la.estado as nome
    FROM public.locais_atendimento la
    JOIN public.medicos m ON m.user_id = la.medico_id
    JOIN public.profiles p ON p.id = m.user_id
    WHERE la.ativo = true 
        AND la.status = 'ativo'
        AND p.user_type = 'medico'
        AND p.is_active = true
    ORDER BY la.estado;
$$;

-- Testar a função de estados
SELECT 'Testando get_available_states:' as test;
SELECT * FROM get_available_states();

-- Corrigir função get_available_cities se necessário
DROP FUNCTION IF EXISTS public.get_available_cities(text);

CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text, estado text, total_medicos bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT 
        la.cidade,
        la.estado,
        COUNT(DISTINCT la.medico_id) as total_medicos
    FROM public.locais_atendimento la
    JOIN public.medicos m ON m.user_id = la.medico_id
    JOIN public.profiles p ON p.id = m.user_id
    WHERE la.ativo = true 
        AND la.status = 'ativo'
        AND (state_uf IS NULL OR la.estado = state_uf)
        AND p.user_type = 'medico'
        AND p.is_active = true
    GROUP BY la.cidade, la.estado
    ORDER BY la.cidade;
$$;

-- Testar a função de cidades
SELECT 'Testando get_available_cities:' as test;
SELECT * FROM get_available_cities('SP');
SELECT * FROM get_available_cities('MG');

-- Criar função melhorada para validar UUIDs
CREATE OR REPLACE FUNCTION public.safe_uuid_check(input_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Verificar se é NULL, string vazia, ou valores inválidos comuns
    IF input_text IS NULL 
       OR input_text = '' 
       OR input_text = 'undefined' 
       OR input_text = 'null' 
       OR LENGTH(input_text) != 36 THEN
        RETURN false;
    END IF;
    
    -- Tentar converter para UUID
    BEGIN
        PERFORM input_text::uuid;
        RETURN true;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN false;
    END;
END;
$$;