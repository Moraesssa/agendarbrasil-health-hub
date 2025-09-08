-- ========================================
-- SETUP DE FUNÇÕES PARA ANÁLISE DO BANCO
-- ========================================

-- Função para executar SQL dinâmico (necessária para análise)
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY EXECUTE format('SELECT to_jsonb(t) FROM (%s) t', sql);
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT to_jsonb(jsonb_build_object(
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        ));
END;
$$;

-- Função para listar todas as tabelas com detalhes
CREATE OR REPLACE FUNCTION public.get_all_tables()
RETURNS TABLE(
    table_name TEXT,
    table_type TEXT,
    row_count BIGINT,
    has_rls BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    count_sql TEXT;
    row_cnt BIGINT;
BEGIN
    FOR rec IN 
        SELECT t.table_name, t.table_type
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        ORDER BY t.table_name
    LOOP
        -- Contar registros
        BEGIN
            count_sql := format('SELECT COUNT(*) FROM public.%I', rec.table_name);
            EXECUTE count_sql INTO row_cnt;
        EXCEPTION
            WHEN OTHERS THEN
                row_cnt := -1; -- Indica erro
        END;
        
        -- Verificar RLS
        SELECT c.relrowsecurity INTO has_rls
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
          AND c.relname = rec.table_name
          AND c.relkind = 'r';
        
        IF has_rls IS NULL THEN
            has_rls := FALSE; -- Views não têm RLS
        END IF;
        
        table_name := rec.table_name;
        table_type := rec.table_type;
        row_count := row_cnt;
        
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Função para listar todas as políticas RLS
CREATE OR REPLACE FUNCTION public.get_all_rls_policies()
RETURNS TABLE(
    table_name TEXT,
    policy_name TEXT,
    policy_cmd TEXT,
    policy_roles TEXT[],
    policy_qual TEXT,
    policy_with_check TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::TEXT,
        p.policyname::TEXT,
        p.cmd::TEXT,
        p.roles,
        p.qual::TEXT,
        p.with_check::TEXT
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname;
END;
$$;

-- Função para listar todas as funções RPC
CREATE OR REPLACE FUNCTION public.get_all_functions()
RETURNS TABLE(
    function_name TEXT,
    function_type TEXT,
    return_type TEXT,
    argument_types TEXT,
    is_security_definer BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.routine_name::TEXT,
        r.routine_type::TEXT,
        r.data_type::TEXT,
        COALESCE(
            (SELECT string_agg(p.parameter_name || ' ' || p.data_type, ', ' ORDER BY p.ordinal_position)
             FROM information_schema.parameters p
             WHERE p.specific_name = r.specific_name
               AND p.parameter_mode = 'IN'),
            'void'
        )::TEXT,
        (r.security_type = 'DEFINER')::BOOLEAN
    FROM information_schema.routines r
    WHERE r.routine_schema = 'public'
      AND r.routine_type = 'FUNCTION'
    ORDER BY r.routine_name;
END;
$$;

-- Função para desabilitar RLS em todas as tabelas
CREATE OR REPLACE FUNCTION public.disable_all_rls()
RETURNS TABLE(
    table_name TEXT,
    action_result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    sql_cmd TEXT;
BEGIN
    FOR rec IN 
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
          AND c.relkind = 'r'
          AND c.relrowsecurity = true
    LOOP
        BEGIN
            sql_cmd := format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', rec.relname);
            EXECUTE sql_cmd;
            
            table_name := rec.relname;
            action_result := 'RLS DISABLED';
            RETURN NEXT;
        EXCEPTION
            WHEN OTHERS THEN
                table_name := rec.relname;
                action_result := 'ERROR: ' || SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
END;
$$;

-- Função para reabilitar RLS em todas as tabelas
CREATE OR REPLACE FUNCTION public.enable_all_rls()
RETURNS TABLE(
    table_name TEXT,
    action_result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    sql_cmd TEXT;
BEGIN
    FOR rec IN 
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
          AND c.relkind = 'r'
    LOOP
        BEGIN
            sql_cmd := format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.relname);
            EXECUTE sql_cmd;
            
            table_name := rec.relname;
            action_result := 'RLS ENABLED';
            RETURN NEXT;
        EXCEPTION
            WHEN OTHERS THEN
                table_name := rec.relname;
                action_result := 'ERROR: ' || SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
END;
$$;

-- Função para testar queries de segurança
CREATE OR REPLACE FUNCTION public.test_table_access(table_name_param TEXT)
RETURNS TABLE(
    test_type TEXT,
    result_status TEXT,
    error_message TEXT,
    row_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_cmd TEXT;
    row_cnt BIGINT;
BEGIN
    -- Teste 1: SELECT básico
    BEGIN
        sql_cmd := format('SELECT COUNT(*) FROM public.%I', table_name_param);
        EXECUTE sql_cmd INTO row_cnt;
        
        test_type := 'SELECT_COUNT';
        result_status := 'SUCCESS';
        error_message := NULL;
        row_count := row_cnt;
        RETURN NEXT;
    EXCEPTION
        WHEN OTHERS THEN
            test_type := 'SELECT_COUNT';
            result_status := 'ERROR';
            error_message := SQLERRM;
            row_count := -1;
            RETURN NEXT;
    END;
    
    -- Teste 2: SELECT com LIMIT
    BEGIN
        sql_cmd := format('SELECT * FROM public.%I LIMIT 1', table_name_param);
        EXECUTE sql_cmd;
        
        test_type := 'SELECT_LIMIT';
        result_status := 'SUCCESS';
        error_message := NULL;
        row_count := 1;
        RETURN NEXT;
    EXCEPTION
        WHEN OTHERS THEN
            test_type := 'SELECT_LIMIT';
            result_status := 'ERROR';
            error_message := SQLERRM;
            row_count := -1;
            RETURN NEXT;
    END;
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_rls_policies() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_functions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.disable_all_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_all_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_table_access(TEXT) TO anon, authenticated;

-- Verificação final
SELECT 'FUNÇÕES DE ANÁLISE CRIADAS COM SUCESSO!' as status;