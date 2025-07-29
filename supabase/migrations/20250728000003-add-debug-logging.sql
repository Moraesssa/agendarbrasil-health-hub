-- Adicionar logging de debug para funções RPC problemáticas
-- Isso ajudará a identificar onde exatamente as funções estão falhando

-- Função de debug para get_specialties
CREATE OR REPLACE FUNCTION public.debug_get_specialties()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    result jsonb;
    user_info jsonb;
    medicos_count integer;
    especialidades_count integer;
BEGIN
    -- Coletar informações do usuário atual
    SELECT jsonb_build_object(
        'user_id', auth.uid(),
        'user_role', auth.role(),
        'user_email', auth.email()
    ) INTO user_info;
    
    -- Contar médicos
    SELECT COUNT(*) INTO medicos_count FROM public.medicos;
    
    -- Contar especialidades médicas
    SELECT COUNT(*) INTO especialidades_count FROM public.especialidades_medicas WHERE ativa = true;
    
    -- Tentar executar a função original
    BEGIN
        SELECT array_to_json(public.get_specialties()) INTO result;
    EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object('error', SQLERRM);
    END;
    
    RETURN jsonb_build_object(
        'user_info', user_info,
        'medicos_count', medicos_count,
        'especialidades_count', especialidades_count,
        'specialties_result', result,
        'timestamp', now()
    );
END;
$function$;

-- Função de debug para get_doctors_by_location_and_specialty
CREATE OR REPLACE FUNCTION public.debug_get_doctors_by_location_and_specialty(
    p_specialty text, 
    p_city text, 
    p_state text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    result jsonb;
    user_info jsonb;
    medicos_with_specialty integer;
    locais_in_city integer;
    profiles_count integer;
BEGIN
    -- Informações do usuário
    SELECT jsonb_build_object(
        'user_id', auth.uid(),
        'user_role', auth.role(),
        'user_email', auth.email()
    ) INTO user_info;
    
    -- Contar médicos com a especialidade
    SELECT COUNT(*) INTO medicos_with_specialty 
    FROM public.medicos 
    WHERE especialidades @> ARRAY[p_specialty];
    
    -- Contar locais na cidade
    SELECT COUNT(*) INTO locais_in_city 
    FROM public.locais_atendimento 
    WHERE (endereco ->> 'cidade') = p_city 
    AND (endereco ->> 'uf') = p_state 
    AND ativo = true;
    
    -- Contar profiles
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    
    -- Tentar executar a função original
    BEGIN
        SELECT jsonb_agg(
            jsonb_build_object('id', id, 'display_name', display_name)
        ) INTO result
        FROM public.get_doctors_by_location_and_specialty(p_specialty, p_city, p_state);
    EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object('error', SQLERRM);
    END;
    
    RETURN jsonb_build_object(
        'parameters', jsonb_build_object(
            'specialty', p_specialty,
            'city', p_city,
            'state', p_state
        ),
        'user_info', user_info,
        'medicos_with_specialty', medicos_with_specialty,
        'locais_in_city', locais_in_city,
        'profiles_count', profiles_count,
        'doctors_result', result,
        'timestamp', now()
    );
END;
$function$;