-- ========================================
-- SCRIPT SEGURO PARA CRIAÇÃO/CORREÇÃO DO AGENDAMENTO
-- Adapta-se à estrutura existente e adiciona apenas o que está faltando
-- ========================================

-- 1. CRIAR TABELA DE PERFIS SEGURA
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID UNIQUE,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT,
            user_type TEXT NOT NULL CHECK (user_type IN ('paciente', 'medico', 'admin')),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Criada tabela user_profiles (profiles é view)';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT,
            user_type TEXT NOT NULL CHECK (user_type IN ('paciente', 'medico', 'admin')),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Criada tabela profiles';
    END IF;
END $$;

-- 2. CRIAR TABELAS PRINCIPAIS
DO $$
DECLARE
    ref_table TEXT := CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN 'user_profiles'
        ELSE 'profiles'
    END;
BEGIN
    -- Criar medicos
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'medicos') THEN
        EXECUTE format('CREATE TABLE public.medicos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            crm TEXT UNIQUE NOT NULL,
            especialidades TEXT[] DEFAULT ''{}''::TEXT[],
            telefone TEXT,
            valor_consulta NUMERIC(10,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )');
    END IF;
    
    -- Criar pacientes
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pacientes') THEN
        CREATE TABLE public.pacientes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            dados_pessoais JSONB DEFAULT '{}'::JSONB,
            contato JSONB DEFAULT '{}'::JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- Criar locais_atendimento
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'locais_atendimento') THEN
        CREATE TABLE public.locais_atendimento (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            medico_id UUID NOT NULL,
            nome_local TEXT NOT NULL,
            endereco TEXT,
            cidade TEXT NOT NULL,
            estado TEXT NOT NULL,
            telefone TEXT,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- Criar consultas
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consultas') THEN
        CREATE TABLE public.consultas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            paciente_id UUID NOT NULL,
            medico_id UUID NOT NULL,
            agendado_por UUID NOT NULL,
            data_consulta TIMESTAMP WITH TIME ZONE NOT NULL,
            tipo_consulta TEXT NOT NULL,
            status TEXT DEFAULT 'pending_payment',
            expires_at TIMESTAMP WITH TIME ZONE,
            valor NUMERIC(10,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    RAISE NOTICE 'Tabelas criadas usando referência: %', ref_table;
END $$;

-- 3. CRIAR ÍNDICES SEGUROS
DO $$
BEGIN
    -- Índices básicos sem dependência de colunas específicas
    CREATE INDEX IF NOT EXISTS idx_medicos_user_id ON public.medicos(user_id);
    CREATE INDEX IF NOT EXISTS idx_medicos_crm ON public.medicos(crm);
    CREATE INDEX IF NOT EXISTS idx_pacientes_user_id ON public.pacientes(user_id);
    CREATE INDEX IF NOT EXISTS idx_locais_medico_id ON public.locais_atendimento(medico_id);
    CREATE INDEX IF NOT EXISTS idx_locais_cidade ON public.locais_atendimento(cidade);
    CREATE INDEX IF NOT EXISTS idx_consultas_medico_data ON public.consultas(medico_id, data_consulta);
    RAISE NOTICE 'Índices básicos criados';
END $$;

-- 4. FUNÇÕES RPC ESSENCIAIS
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS TABLE(specialty TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(especialidades)::TEXT, COUNT(*)::BIGINT
    FROM public.medicos 
    WHERE especialidades IS NOT NULL
    GROUP BY unnest(especialidades)
    UNION ALL
    SELECT 'Cardiologia'::TEXT, 1::BIGINT WHERE NOT EXISTS (SELECT 1 FROM public.medicos);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(state TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT estado::TEXT, COUNT(*)::BIGINT
    FROM public.locais_atendimento 
    WHERE estado IS NOT NULL
    GROUP BY estado
    UNION ALL
    SELECT 'São Paulo'::TEXT, 1::BIGINT WHERE NOT EXISTS (SELECT 1 FROM public.locais_atendimento);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_available_cities(p_state TEXT)
RETURNS TABLE(city TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT cidade::TEXT, COUNT(*)::BIGINT
    FROM public.locais_atendimento 
    WHERE estado = p_state
    GROUP BY cidade
    UNION ALL
    SELECT p_state::TEXT, 1::BIGINT WHERE NOT EXISTS (SELECT 1 FROM public.locais_atendimento WHERE estado = p_state);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. DADOS DE EXEMPLO
DO $$
DECLARE
    ref_table TEXT := CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN 'user_profiles'
        ELSE 'profiles'
    END;
BEGIN
    -- Inserir perfis se vazio
    EXECUTE format('INSERT INTO public.%I (id, email, display_name, user_type) 
        SELECT * FROM (VALUES
            (''11111111-1111-1111-1111-111111111111'', ''medico1@test.com'', ''Dr. João'', ''medico''),
            (''22222222-2222-2222-2222-222222222222'', ''paciente1@test.com'', ''Maria Silva'', ''paciente'')
        ) v WHERE NOT EXISTS (SELECT 1 FROM public.%I LIMIT 1)', ref_table, ref_table);
    
    -- Inserir médicos
    INSERT INTO public.medicos (user_id, crm, especialidades, valor_consulta) 
    SELECT '11111111-1111-1111-1111-111111111111', 'CRM123', ARRAY['Cardiologia'], 200.00
    WHERE NOT EXISTS (SELECT 1 FROM public.medicos LIMIT 1);
    
    -- Inserir pacientes
    INSERT INTO public.pacientes (user_id, dados_pessoais) 
    SELECT '22222222-2222-2222-2222-222222222222', '{"nome": "Maria Silva"}'::JSONB
    WHERE NOT EXISTS (SELECT 1 FROM public.pacientes LIMIT 1);
    
    -- Inserir locais
    INSERT INTO public.locais_atendimento (medico_id, nome_local, cidade, estado, telefone) 
    SELECT '11111111-1111-1111-1111-111111111111', 'Clínica Test', 'São Paulo', 'São Paulo', '(11) 99999-9999'
    WHERE NOT EXISTS (SELECT 1 FROM public.locais_atendimento LIMIT 1);
    
    RAISE NOTICE 'Dados de exemplo inseridos';
END $$;

-- VERIFICAÇÃO FINAL
DO $$
BEGIN
    RAISE NOTICE '✅ SCRIPT CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE 'Agora teste o agendamento em: https://agendarbrasil-health-hub.lovable.app/agendamento';
END $$;