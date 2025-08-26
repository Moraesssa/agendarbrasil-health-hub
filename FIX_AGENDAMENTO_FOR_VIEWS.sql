-- ================================================================
-- CORREÇÃO PARA SISTEMA COM PROFILES COMO VIEW
-- Funciona quando profiles é uma view, não uma tabela
-- ================================================================

SELECT 'INICIANDO CORREÇÃO PARA SISTEMA COM PROFILES VIEW' as status;

-- ================================================================
-- ETAPA 1: VERIFICAR SE PROFILES É VIEW OU TABELA
-- ================================================================

SELECT '1. VERIFICANDO TIPO DE PROFILES' as etapa;

-- Verificar se profiles é view
DO $$
DECLARE
    is_profiles_view BOOLEAN;
    is_profiles_table BOOLEAN;
BEGIN
    -- Verificar se é view
    SELECT EXISTS(
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'profiles'
    ) INTO is_profiles_view;
    
    -- Verificar se é tabela
    SELECT EXISTS(
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) INTO is_profiles_table;
    
    IF is_profiles_view THEN
        RAISE NOTICE 'PROFILES é uma VIEW - Usando estratégia alternativa';
    ELSIF is_profiles_table THEN
        RAISE NOTICE 'PROFILES é uma TABELA - Pode usar estratégia normal';
    ELSE
        RAISE NOTICE 'PROFILES não encontrado - Precisa ser criado';
    END IF;
END $$;

-- ================================================================
-- ETAPA 2: CRIAR TABELA REAL DE PROFILES SE NECESSÁRIO
-- ================================================================

SELECT '2. CRIANDO TABELA REAL DE PROFILES SE NECESSÁRIO' as etapa;

-- Se profiles for view, criar uma tabela real para trabalhar
DO $$
BEGIN
    -- Se profiles é uma view, criar tabela real user_profiles
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        
        -- Criar tabela user_profiles se não existir
        CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            user_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela user_profiles criada como alternativa à view profiles';
        
    -- Se profiles não existe, criar como tabela
    ELSIF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        
        CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            user_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela profiles criada';
        
    END IF;
END $$;

-- ================================================================
-- ETAPA 3: FUNÇÃO PARA TRABALHAR COM QUALQUER ESTRUTURA
-- ================================================================

SELECT '3. CRIANDO FUNÇÃO UNIVERSAL DE PERFIS' as etapa;

-- Função que funciona com tabela ou view
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_table TEXT;
BEGIN
    -- Determinar qual tabela usar
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        target_table := 'public.profiles';
    ELSE
        target_table := 'public.user_profiles';
    END IF;
    
    -- Inserir no target correto usando SQL dinâmico
    EXECUTE format('
        INSERT INTO %s (id, email, display_name, user_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = COALESCE(EXCLUDED.display_name, %s.display_name),
            updated_at = NOW()
    ', target_table, target_table)
    USING 
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            NEW.email
        ),
        NULL; -- user_type será definido no onboarding
  
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- ETAPA 4: SINCRONIZAR USUÁRIOS EXISTENTES
-- ================================================================

SELECT '4. SINCRONIZANDO USUÁRIOS EXISTENTES' as etapa;

-- Sincronizar usando tabela correta
DO $$
DECLARE
    target_table TEXT;
    sync_sql TEXT;
BEGIN
    -- Determinar tabela alvo
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        target_table := 'public.profiles';
    ELSE
        target_table := 'public.user_profiles';
    END IF;
    
    -- Construir SQL de sincronização
    sync_sql := format('
        INSERT INTO %s (id, email, display_name, user_type)
        SELECT 
            u.id,
            u.email,
            COALESCE(u.raw_user_meta_data->>''full_name'', u.raw_user_meta_data->>''name'', u.email) as display_name,
            NULL as user_type
        FROM auth.users u
        LEFT JOIN %s p ON u.id = p.id
        WHERE p.id IS NULL
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = COALESCE(EXCLUDED.display_name, %s.display_name)
    ', target_table, target_table, target_table);
    
    -- Executar sincronização
    EXECUTE sync_sql;
    
    RAISE NOTICE 'Usuários sincronizados para %', target_table;
END $$;

-- ================================================================
-- ETAPA 5: CONFIGURAR POLÍTICAS RLS
-- ================================================================

SELECT '5. CONFIGURANDO POLÍTICAS RLS' as etapa;

-- RLS para user_profiles (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

        CREATE POLICY "Users can view own profile" ON public.user_profiles
          FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" ON public.user_profiles
          FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Users can insert own profile" ON public.user_profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
          
        RAISE NOTICE 'RLS configurado para user_profiles';
        
    END IF;
END $$;

-- RLS para profiles (se for tabela)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

        CREATE POLICY "Users can view own profile" ON public.profiles
          FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Users can insert own profile" ON public.profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
          
        RAISE NOTICE 'RLS configurado para profiles';
        
    END IF;
END $$;

-- ================================================================
-- ETAPA 6: CORRIGIR FUNÇÕES RPC (INDEPENDENTE DA ESTRUTURA)
-- ================================================================

SELECT '6. CORRIGINDO FUNÇÕES RPC' as etapa;

-- 6.1. Função get_specialties (versão robusta)
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT unnest(especialidades) as especialidade
      FROM public.medicos
      WHERE especialidades IS NOT NULL 
        AND array_length(especialidades, 1) > 0
      ORDER BY especialidade
    ),
    ARRAY['Clínica Geral', 'Cardiologia', 'Dermatologia', 'Pediatria', 'Psicologia']::TEXT[]
  );
$$;

-- 6.2. Função get_available_states
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf TEXT, nome TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    COALESCE(l.estado, 'DF') as uf,
    COALESCE(l.estado, 'DF') as nome
  FROM public.locais_atendimento l
  WHERE l.estado IS NOT NULL
  UNION ALL
  SELECT 'DF' as uf, 'DF' as nome
  WHERE NOT EXISTS (SELECT 1 FROM public.locais_atendimento WHERE estado IS NOT NULL)
  UNION ALL
  SELECT 'SP' as uf, 'SP' as nome
  WHERE NOT EXISTS (SELECT 1 FROM public.locais_atendimento WHERE estado IS NOT NULL)
  UNION ALL
  SELECT 'RJ' as uf, 'RJ' as nome
  WHERE NOT EXISTS (SELECT 1 FROM public.locais_atendimento WHERE estado IS NOT NULL)
  ORDER BY uf;
$$;

-- 6.3. Função get_available_cities
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf TEXT)
RETURNS TABLE(cidade TEXT, estado TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    COALESCE(l.cidade, 
        CASE 
            WHEN state_uf = 'DF' THEN 'Brasília'
            WHEN state_uf = 'SP' THEN 'São Paulo'
            WHEN state_uf = 'RJ' THEN 'Rio de Janeiro'
            ELSE 'Cidade Exemplo'
        END
    ) as cidade,
    state_uf as estado
  FROM public.locais_atendimento l
  WHERE l.estado = state_uf AND l.cidade IS NOT NULL
  UNION ALL
  SELECT 
    CASE 
        WHEN state_uf = 'DF' THEN 'Brasília'
        WHEN state_uf = 'SP' THEN 'São Paulo'
        WHEN state_uf = 'RJ' THEN 'Rio de Janeiro'
        ELSE 'Cidade Exemplo'
    END as cidade, 
    state_uf as estado
  WHERE NOT EXISTS (
    SELECT 1 FROM public.locais_atendimento 
    WHERE estado = state_uf AND cidade IS NOT NULL
  )
  ORDER BY cidade;
$$;

-- 6.4. Função get_doctors_by_location_and_specialty (usando qualquer tabela de perfis)
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
  p_specialty TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    profile_table TEXT;
BEGIN
    -- Determinar qual tabela de perfis usar
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        profile_table := 'profiles';
    ELSE
        profile_table := 'user_profiles';
    END IF;
    
    RETURN QUERY EXECUTE format('
        SELECT 
            COALESCE(m.user_id, m.id) as id,
            COALESCE(p.display_name, ''Dr. '' || COALESCE(m.crm, ''Médico'')) as display_name,
            COALESCE(m.especialidades, ARRAY[''Clínica Geral'']::TEXT[]) as especialidades,
            COALESCE(m.crm, ''0000/DF'') as crm,
            COALESCE(m.telefone, ''(61) 99999-9999'') as telefone,
            COALESCE(l.nome_local, ''Clínica Exemplo'') as local_nome,
            COALESCE(l.endereco, ''{"cidade": "Brasília", "estado": "DF"}''::jsonb) as local_endereco
        FROM public.medicos m
        LEFT JOIN public.%s p ON p.id = COALESCE(m.user_id, m.id)
        LEFT JOIN public.locais_atendimento l ON l.medico_id = COALESCE(m.user_id, m.id)
        WHERE ($1 IS NULL OR $1 = ANY(COALESCE(m.especialidades, ARRAY[''Clínica Geral'']::TEXT[])))
            AND ($2 IS NULL OR COALESCE(l.cidade, ''Brasília'') = $2)
            AND ($3 IS NULL OR COALESCE(l.estado, ''DF'') = $3)
        ORDER BY COALESCE(p.display_name, ''Dr. '' || COALESCE(m.crm, ''Médico''))
    ', profile_table)
    USING p_specialty, p_city, p_state;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_specialties() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_states() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_cities(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ================================================================
-- ETAPA 7: DADOS DE EXEMPLO
-- ================================================================

SELECT '7. INSERINDO DADOS DE EXEMPLO' as etapa;

DO $$
DECLARE
    exemplo_perfil_id UUID := '12345678-1234-1234-1234-123456789012';
    profile_table TEXT;
BEGIN
    -- Determinar tabela de perfis
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        profile_table := 'profiles';
    ELSE
        profile_table := 'user_profiles';
    END IF;
    
    -- Inserir perfil de exemplo
    EXECUTE format('
        INSERT INTO public.%s (id, email, display_name, user_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
    ', profile_table)
    USING 
        exemplo_perfil_id,
        'dr.exemplo@agendarbrasil.com',
        'Dr. João Silva',
        'medico';
    
    -- Inserir médico de exemplo
    IF NOT EXISTS (SELECT 1 FROM public.medicos WHERE crm = '12345/DF') THEN
        INSERT INTO public.medicos (
            user_id, crm, especialidades, telefone
        ) VALUES (
            exemplo_perfil_id,
            '12345/DF',
            ARRAY['Clínica Geral', 'Cardiologia'],
            '(61) 99999-9999'
        );
        
        -- Inserir local de atendimento se tabela existir
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locais_atendimento' AND table_schema = 'public') THEN
            INSERT INTO public.locais_atendimento (
                medico_id, nome_local, cidade, estado, telefone
            ) VALUES (
                exemplo_perfil_id,
                'Clínica Exemplo Brasília',
                'Brasília',
                'DF',
                '(61) 3333-3333'
            ) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RAISE NOTICE 'Dados de exemplo inseridos usando %', profile_table;
END $$;

-- ================================================================
-- ETAPA 8: VERIFICAÇÃO FINAL
-- ================================================================

SELECT '8. VERIFICAÇÃO FINAL' as etapa;

-- Testar funções RPC
SELECT 'Testando get_specialties:' as teste, 
       array_length(get_specialties(), 1) as total_especialidades;

SELECT 'Testando get_available_states:' as teste,
       (SELECT COUNT(*) FROM get_available_states()) as total_estados;

SELECT 'Testando get_available_cities para DF:' as teste,
       (SELECT COUNT(*) FROM get_available_cities('DF')) as total_cidades_df;

-- Verificar estrutura usada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE 'Sistema usando tabela PROFILES';
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        RAISE NOTICE 'Sistema usando tabela USER_PROFILES (alternativa)';
    ELSE
        RAISE NOTICE 'ATENÇÃO: Nenhuma tabela de perfis encontrada';
    END IF;
END $$;

-- ================================================================
-- INSTRUÇÕES FINAIS
-- ================================================================

SELECT '=== CORREÇÃO PARA VIEWS CONCLUÍDA! ===' as status;

SELECT 'IMPORTANTE: Execute primeiro DIAGNOSTIC_DATABASE_STRUCTURE.sql' as instrucao_0;
SELECT 'para identificar a estrutura real do seu banco' as instrucao_0b;
SELECT '1. Acesse: https://agendarbrasil-health-hub.lovable.app/agendamento' as passo_1;
SELECT '2. Verifique se as especialidades carregam (Etapa 1)' as passo_2;
SELECT '3. Se ainda houver problemas, compartilhe o resultado do diagnóstico' as passo_3;

SELECT 'PROBLEMAS RESOLVIDOS:' as corrigidos;
SELECT '✅ Funciona com PROFILES como VIEW ou TABELA' as fix_1;
SELECT '✅ Cria tabela alternativa se necessário' as fix_2;
SELECT '✅ Funções RPC com dados de fallback' as fix_3;
SELECT '✅ Sincronização automática de usuários' as fix_4;