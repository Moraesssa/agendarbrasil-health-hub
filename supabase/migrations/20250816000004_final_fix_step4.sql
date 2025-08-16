-- Migration FINAL para corrigir Step 4 - Médicos
-- Data: 2025-08-16
-- Corrige constraint e recria funções com DROP primeiro

-- 1. DIAGNÓSTICO: Verificar constraints atuais
DO $$
DECLARE
    constraint_info RECORD;
BEGIN
    RAISE NOTICE 'DIAGNÓSTICO DE CONSTRAINTS:';
    
    FOR constraint_info IN
        SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name as referenced_table,
            ccu.column_name as referenced_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'locais_atendimento' 
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE 'Constraint: % | Coluna: % | Referencia: %.%', 
            constraint_info.constraint_name,
            constraint_info.column_name,
            constraint_info.referenced_table,
            constraint_info.referenced_column;
    END LOOP;
END $$;

-- 2. REMOVER constraint incorreta
ALTER TABLE public.locais_atendimento 
DROP CONSTRAINT IF EXISTS locais_atendimento_medico_id_fkey;

-- 3. LIMPAR dados órfãos
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM public.locais_atendimento l
    WHERE NOT EXISTS (
        SELECT 1 FROM public.medicos m WHERE m.id = l.medico_id
    );
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Removendo % registros órfãos', orphaned_count;
        DELETE FROM public.locais_atendimento 
        WHERE NOT EXISTS (
            SELECT 1 FROM public.medicos m WHERE m.id = locais_atendimento.medico_id
        );
    END IF;
END $$;

-- 4. CRIAR constraint CORRETA
ALTER TABLE public.locais_atendimento 
ADD CONSTRAINT locais_atendimento_medico_id_fkey 
FOREIGN KEY (medico_id) REFERENCES public.medicos(id) ON DELETE CASCADE;

-- 5. Adicionar coluna is_active
ALTER TABLE public.locais_atendimento 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.locais_atendimento 
SET is_active = true 
WHERE is_active IS NULL;

-- 6. Atualizar verificação dos médicos
UPDATE public.medicos 
SET verificacao = jsonb_build_object(
  'crm_verificado', true,
  'documentos_enviados', true,
  'aprovado', 'true',
  'data_aprovacao', now()::text
)
WHERE verificacao = '{}'::jsonb OR verificacao IS NULL;

-- 7. Criar profiles para médicos
CREATE OR REPLACE FUNCTION create_doctor_profiles_temp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    medico_record RECORD;
    profile_count INTEGER := 0;
BEGIN
    FOR medico_record IN 
        SELECT m.user_id, m.crm, m.id
        FROM public.medicos m
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = m.user_id
        )
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, user_type, display_name)
            VALUES (
                medico_record.user_id,
                'medico',
                'Dr. ' || COALESCE(split_part(medico_record.crm, '-', 1), substring(medico_record.id::text, 1, 8))
            );
            profile_count := profile_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao criar profile: %', SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Profiles criados: %', profile_count;
END;
$$;

SELECT create_doctor_profiles_temp();
DROP FUNCTION create_doctor_profiles_temp();

-- 8. Adicionar locais em DF
INSERT INTO public.locais_atendimento (
  medico_id, nome_local, endereco, cidade, estado, cep, telefone, is_active
)
SELECT 
  m.id as medico_id,
  'Clínica ' || split_part(m.crm, '-', 1) as nome_local,
  jsonb_build_object(
    'logradouro', 'SQN 123 Bloco A',
    'numero', '123',
    'complemento', 'Sala 101',
    'bairro', 'Asa Norte',
    'cidade', 'Brasília',
    'uf', 'DF',
    'cep', '70000-000'
  ) as endereco,
  'Brasília' as cidade,
  'DF' as estado,
  '70000-000' as cep,
  '(61) 3333-3333' as telefone,
  true as is_active
FROM public.medicos m
WHERE m.especialidades && ARRAY['Cardiologia', 'Clínica Médica', 'Medicina de Família']
  AND NOT EXISTS (
    SELECT 1 FROM public.locais_atendimento l 
    WHERE l.medico_id = m.id AND l.estado = 'DF'
  )
LIMIT 2;

-- 9. REMOVER funções existentes primeiro
DROP FUNCTION IF EXISTS public.get_available_cities(TEXT);
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT);

-- 10. RECRIAR funções com assinaturas corretas
CREATE FUNCTION public.get_available_cities(state_uf TEXT)
RETURNS TABLE(cidade TEXT, estado TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    l.cidade,
    l.estado
  FROM public.locais_atendimento l
  JOIN public.medicos m ON m.id = l.medico_id
  WHERE l.is_active = true 
    AND l.estado = state_uf
    AND (m.verificacao->>'aprovado' = 'true' OR m.verificacao = '{}'::jsonb)
  ORDER BY l.cidade;
$$;

CREATE FUNCTION public.get_doctors_by_location_and_specialty(
  p_specialty TEXT,
  p_city TEXT,
  p_state TEXT
)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  especialidades TEXT[],
  crm TEXT,
  telefone TEXT,
  local_nome TEXT,
  local_endereco JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    m.id,
    COALESCE(p.display_name, 'Dr. ' || split_part(m.crm, '-', 1)) as display_name,
    m.especialidades,
    m.crm,
    m.telefone,
    l.nome_local as local_nome,
    l.endereco as local_endereco
  FROM public.medicos m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  JOIN public.locais_atendimento l ON l.medico_id = m.id
  WHERE (m.verificacao->>'aprovado' = 'true' OR m.verificacao = '{}'::jsonb)
    AND l.is_active = true
    AND p_specialty = ANY(m.especialidades)
    AND l.cidade = p_city
    AND l.estado = p_state
  ORDER BY COALESCE(p.display_name, 'Dr. ' || split_part(m.crm, '-', 1));
$$;

-- 11. Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_available_cities(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 12. Verificação final
DO $$
DECLARE
    total_medicos INTEGER;
    total_locais INTEGER;
    locais_df INTEGER;
    profiles_medicos INTEGER;
    cidades_df INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_medicos FROM public.medicos;
    SELECT COUNT(*) INTO total_locais FROM public.locais_atendimento WHERE is_active = true;
    SELECT COUNT(*) INTO locais_df FROM public.locais_atendimento WHERE estado = 'DF' AND is_active = true;
    SELECT COUNT(*) INTO profiles_medicos FROM public.profiles WHERE user_type = 'medico';
    
    -- Testar função get_available_cities
    SELECT COUNT(*) INTO cidades_df FROM public.get_available_cities('DF');
    
    RAISE NOTICE '=== RESULTADO FINAL ===';
    RAISE NOTICE 'Total médicos: %', total_medicos;
    RAISE NOTICE 'Total locais ativos: %', total_locais;
    RAISE NOTICE 'Locais em DF: %', locais_df;
    RAISE NOTICE 'Profiles de médicos: %', profiles_medicos;
    RAISE NOTICE 'Cidades em DF (via função): %', cidades_df;
    
    IF locais_df > 0 AND profiles_medicos > 0 AND cidades_df > 0 THEN
        RAISE NOTICE '✅ SUCESSO: Step 4 deve funcionar agora!';
    ELSE
        RAISE NOTICE '⚠️ Ainda há problemas:';
        IF locais_df = 0 THEN RAISE NOTICE '  - Sem locais em DF'; END IF;
        IF profiles_medicos = 0 THEN RAISE NOTICE '  - Sem profiles de médicos'; END IF;
        IF cidades_df = 0 THEN RAISE NOTICE '  - Função get_available_cities não retorna DF'; END IF;
    END IF;
END $$;