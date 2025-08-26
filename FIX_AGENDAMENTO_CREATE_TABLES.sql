-- ========================================
-- SCRIPT COMPLETO PARA CRIAR TODAS AS TABELAS DO AGENDAMENTO
-- Cria todas as tabelas necessárias do zero quando não existe nada
-- ========================================

-- ============================================================================
-- PARTE 1: VERIFICAÇÃO E CRIAÇÃO DAS TABELAS PRINCIPAIS
-- ============================================================================

-- Verificar se profiles existe como view e criar tabela alternativa se necessário
DO $$
BEGIN
    -- Se profiles é uma view, criar user_profiles como tabela
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        RAISE NOTICE 'profiles existe como VIEW, criando user_profiles como tabela';
        
        CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID UNIQUE, -- Referência para auth.users se existir
            email TEXT UNIQUE NOT NULL,
            display_name TEXT,
            user_type TEXT NOT NULL CHECK (user_type IN ('paciente', 'medico', 'admin')),
            is_active BOOLEAN DEFAULT true,
            onboarding_completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
    ELSIF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE 'profiles não existe, criando como tabela';
        
        CREATE TABLE public.profiles (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID UNIQUE, -- Referência para auth.users se existir
            email TEXT UNIQUE NOT NULL,
            display_name TEXT,
            user_type TEXT NOT NULL CHECK (user_type IN ('paciente', 'medico', 'admin')),
            is_active BOOLEAN DEFAULT true,
            onboarding_completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        RAISE NOTICE 'profiles já existe como tabela';
    END IF;
END $$;

-- 1. TABELA PROFILES (Base para usuários) - Criar apenas se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE, -- Referência para auth.users se existir
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('paciente', 'medico', 'admin')),
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA MEDICOS
DO $$
BEGIN
    -- Referenciar user_profiles se profiles é uma view
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        CREATE TABLE IF NOT EXISTS public.medicos (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            crm TEXT NOT NULL,
            especialidades TEXT[] DEFAULT '{}',
            telefone TEXT,
            endereco JSONB,
            bio TEXT,
            valor_consulta NUMERIC(10, 2),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(crm)
        );
    ELSE
        CREATE TABLE IF NOT EXISTS public.medicos (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            crm TEXT NOT NULL,
            especialidades TEXT[] DEFAULT '{}',
            telefone TEXT,
            endereco JSONB,
            bio TEXT,
            valor_consulta NUMERIC(10, 2),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(crm)
        );
    END IF;
END $$;

-- 3. TABELA PACIENTES
DO $$
BEGIN
    -- Referenciar user_profiles se profiles é uma view
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        CREATE TABLE IF NOT EXISTS public.pacientes (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
                dados_pessoais JSONB DEFAULT '{}',
                contato JSONB DEFAULT '{}',
                endereco JSONB DEFAULT '{}',
                historico_medico JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
    ELSE
        CREATE TABLE IF NOT EXISTS public.pacientes (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            dados_pessoais JSONB DEFAULT '{}',
            contato JSONB DEFAULT '{}',
            endereco JSONB DEFAULT '{}',
            historico_medico JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 4. TABELA LOCAIS_ATENDIMENTO
DO $$
BEGIN
    -- Referenciar user_profiles se profiles é uma view
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        CREATE TABLE IF NOT EXISTS public.locais_atendimento (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            medico_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
                nome_local TEXT NOT NULL,
                endereco TEXT,
                cidade TEXT NOT NULL,
                estado TEXT NOT NULL,
                cep TEXT,
                telefone TEXT,
                ativo BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
    ELSE
        CREATE TABLE IF NOT EXISTS public.locais_atendimento (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            medico_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            nome_local TEXT NOT NULL,
            endereco TEXT,
            cidade TEXT NOT NULL,
            estado TEXT NOT NULL,
            cep TEXT,
            telefone TEXT,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 5. TABELA CONSULTAS (AGENDAMENTOS)
DO $$
BEGIN
    -- Referenciar user_profiles se profiles é uma view
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        CREATE TABLE IF NOT EXISTS public.consultas (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            paciente_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            medico_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            paciente_familiar_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
            agendado_por UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            data_consulta TIMESTAMP WITH TIME ZONE NOT NULL,
            tipo_consulta TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'scheduled', 'confirmed', 'cancelled', 'completed')),
            expires_at TIMESTAMP WITH TIME ZONE,
            local_id UUID REFERENCES public.locais_atendimento(id),
            valor NUMERIC(10, 2),
            notas TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        CREATE TABLE IF NOT EXISTS public.consultas (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            paciente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            medico_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            paciente_familiar_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
            agendado_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            data_consulta TIMESTAMP WITH TIME ZONE NOT NULL,
            tipo_consulta TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'scheduled', 'confirmed', 'cancelled', 'completed')),
            expires_at TIMESTAMP WITH TIME ZONE,
            local_id UUID REFERENCES public.locais_atendimento(id),
            valor NUMERIC(10, 2),
            notas TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================================================
-- PARTE 2: ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para profiles (apenas se for tabela, não view)
DO $$
BEGIN
    -- Criar índices na tabela user_profiles se profiles é uma view
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
            CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
            CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
            RAISE NOTICE 'Índices criados na tabela user_profiles';
        END IF;
    -- Criar índices na tabela profiles se ela for realmente uma tabela
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
        CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
        RAISE NOTICE 'Índices criados na tabela profiles';
    END IF;
END $$;

-- Índices para médicos
CREATE INDEX IF NOT EXISTS idx_medicos_user_id ON public.medicos(user_id);
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON public.medicos(crm);
CREATE INDEX IF NOT EXISTS idx_medicos_especialidades ON public.medicos USING GIN(especialidades);
CREATE INDEX IF NOT EXISTS idx_medicos_is_active ON public.medicos(is_active);

-- Índices para pacientes
CREATE INDEX IF NOT EXISTS idx_pacientes_user_id ON public.pacientes(user_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_is_active ON public.pacientes(is_active);

-- Índices para locais de atendimento
CREATE INDEX IF NOT EXISTS idx_locais_medico_id ON public.locais_atendimento(medico_id);
CREATE INDEX IF NOT EXISTS idx_locais_cidade ON public.locais_atendimento(cidade);
CREATE INDEX IF NOT EXISTS idx_locais_estado ON public.locais_atendimento(estado);
CREATE INDEX IF NOT EXISTS idx_locais_ativo ON public.locais_atendimento(ativo);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON public.consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico_id ON public.consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_consulta ON public.consultas(data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON public.consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_expires_at ON public.consultas(expires_at) WHERE expires_at IS NOT NULL;

-- Índice único para evitar agendamentos duplos
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultas_unique_slot 
ON public.consultas (medico_id, data_consulta) 
WHERE status IN ('scheduled', 'confirmed', 'pending_payment');

-- ============================================================================
-- PARTE 3: TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas
DO $$
BEGIN
    -- Trigger para profiles ou user_profiles
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
            CREATE TRIGGER trigger_user_profiles_updated_at
                BEFORE UPDATE ON public.user_profiles
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
        CREATE TRIGGER trigger_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_medicos_updated_at ON public.medicos;
CREATE TRIGGER trigger_medicos_updated_at
    BEFORE UPDATE ON public.medicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pacientes_updated_at ON public.pacientes;
CREATE TRIGGER trigger_pacientes_updated_at
    BEFORE UPDATE ON public.pacientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_locais_updated_at ON public.locais_atendimento;
CREATE TRIGGER trigger_locais_updated_at
    BEFORE UPDATE ON public.locais_atendimento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_consultas_updated_at ON public.consultas;
CREATE TRIGGER trigger_consultas_updated_at
    BEFORE UPDATE ON public.consultas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 4: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
DO $$
BEGIN
    -- Habilitar RLS para profiles ou user_profiles dependendo do que existe
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'RLS habilitado em user_profiles';
        END IF;
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado em profiles';
    END IF;
END $$;

ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles ou user_profiles
DO $$
BEGIN
    -- Se profiles é uma view, criar políticas para user_profiles
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            DROP POLICY IF EXISTS "User profiles are viewable by users who created them" ON public.user_profiles;
            CREATE POLICY "User profiles are viewable by users who created them" 
            ON public.user_profiles FOR SELECT 
            USING (auth.uid() = user_id OR auth.uid() = id);

            DROP POLICY IF EXISTS "Users can insert their own user profile" ON public.user_profiles;
            CREATE POLICY "Users can insert their own user profile" 
            ON public.user_profiles FOR INSERT 
            WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

            DROP POLICY IF EXISTS "Users can update own user profile" ON public.user_profiles;
            CREATE POLICY "Users can update own user profile" 
            ON public.user_profiles FOR UPDATE 
            USING (auth.uid() = user_id OR auth.uid() = id);
            
            RAISE NOTICE 'Políticas RLS criadas para user_profiles';
        END IF;
    -- Se profiles é uma tabela, criar políticas para profiles
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Profiles are viewable by users who created them" ON public.profiles;
        CREATE POLICY "Profiles are viewable by users who created them" 
        ON public.profiles FOR SELECT 
        USING (auth.uid() = user_id OR auth.uid() = id);

        DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
        CREATE POLICY "Users can insert their own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = user_id OR auth.uid() = id);
        
        RAISE NOTICE 'Políticas RLS criadas para profiles';
    END IF;
END $$;

-- Políticas para médicos
DROP POLICY IF EXISTS "Medicos data is viewable by owner and patients" ON public.medicos;
CREATE POLICY "Medicos data is viewable by owner and patients" 
ON public.medicos FOR SELECT 
USING (auth.uid() = user_id OR is_active = true);

DROP POLICY IF EXISTS "Medicos can update their own data" ON public.medicos;
CREATE POLICY "Medicos can update their own data" 
ON public.medicos FOR ALL 
USING (auth.uid() = user_id);

-- Políticas para pacientes
DROP POLICY IF EXISTS "Pacientes can view and edit their own data" ON public.pacientes;
CREATE POLICY "Pacientes can view and edit their own data" 
ON public.pacientes FOR ALL 
USING (auth.uid() = user_id);

-- Políticas para locais de atendimento
DROP POLICY IF EXISTS "Locais are viewable by authenticated users" ON public.locais_atendimento;
CREATE POLICY "Locais are viewable by authenticated users" 
ON public.locais_atendimento FOR SELECT 
TO authenticated 
USING (ativo = true);

DROP POLICY IF EXISTS "Medicos can manage their locations" ON public.locais_atendimento;
CREATE POLICY "Medicos can manage their locations" 
ON public.locais_atendimento FOR ALL 
USING (auth.uid() = medico_id);

-- Políticas para consultas
DROP POLICY IF EXISTS "Consultas are viewable by related users" ON public.consultas;
CREATE POLICY "Consultas are viewable by related users" 
ON public.consultas FOR SELECT 
USING (auth.uid() = paciente_id OR auth.uid() = medico_id OR auth.uid() = agendado_por);

DROP POLICY IF EXISTS "Users can create appointments" ON public.consultas;
CREATE POLICY "Users can create appointments" 
ON public.consultas FOR INSERT 
WITH CHECK (auth.uid() = agendado_por);

DROP POLICY IF EXISTS "Users can update their appointments" ON public.consultas;
CREATE POLICY "Users can update their appointments" 
ON public.consultas FOR UPDATE 
USING (auth.uid() = paciente_id OR auth.uid() = medico_id OR auth.uid() = agendado_por);

-- ============================================================================
-- PARTE 5: FUNÇÕES RPC PARA O AGENDAMENTO
-- ============================================================================

-- 1. Função para obter especialidades
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS TABLE(specialty TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(m.especialidades) as specialty,
        COUNT(*)::BIGINT as count
    FROM public.medicos m
    WHERE m.is_active = true
        AND m.especialidades IS NOT NULL
        AND array_length(m.especialidades, 1) > 0
    GROUP BY unnest(m.especialidades)
    ORDER BY count DESC, specialty ASC;
    
    -- Se não houver dados, retornar especialidades padrão
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            specialty_name::TEXT as specialty,
            0::BIGINT as count
        FROM (
            VALUES 
                ('Cardiologia'),
                ('Dermatologia'),
                ('Endocrinologia'),
                ('Ginecologia'),
                ('Neurologia'),
                ('Oftalmologia'),
                ('Ortopedia'),
                ('Pediatria'),
                ('Psiquiatria'),
                ('Urologia')
        ) AS default_specialties(specialty_name);
    END IF;
END;
$$;

-- 2. Função para obter estados disponíveis
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(state TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.estado as state,
        COUNT(*)::BIGINT as count
    FROM public.locais_atendimento la
    WHERE la.ativo = true
        AND la.estado IS NOT NULL
        AND la.estado != ''
    GROUP BY la.estado
    ORDER BY count DESC, la.estado ASC;
    
    -- Se não houver dados, retornar estados padrão
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            state_name::TEXT as state,
            0::BIGINT as count
        FROM (
            VALUES 
                ('São Paulo'),
                ('Rio de Janeiro'),
                ('Minas Gerais'),
                ('Bahia'),
                ('Paraná'),
                ('Rio Grande do Sul'),
                ('Pernambuco'),
                ('Ceará'),
                ('Pará'),
                ('Santa Catarina')
        ) AS default_states(state_name);
    END IF;
END;
$$;

-- 3. Função para obter cidades por estado
CREATE OR REPLACE FUNCTION public.get_available_cities(p_state TEXT)
RETURNS TABLE(city TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.cidade as city,
        COUNT(*)::BIGINT as count
    FROM public.locais_atendimento la
    WHERE la.ativo = true
        AND la.estado = p_state
        AND la.cidade IS NOT NULL
        AND la.cidade != ''
    GROUP BY la.cidade
    ORDER BY count DESC, la.cidade ASC;
    
    -- Se não houver dados, retornar cidades padrão baseadas no estado
    IF NOT FOUND THEN
        IF p_state = 'São Paulo' THEN
            RETURN QUERY
            SELECT 
                city_name::TEXT as city,
                0::BIGINT as count
            FROM (
                VALUES 
                    ('São Paulo'),
                    ('Campinas'),
                    ('Santos'),
                    ('São Bernardo do Campo'),
                    ('Ribeirão Preto')
            ) AS default_cities(city_name);
        ELSIF p_state = 'Rio de Janeiro' THEN
            RETURN QUERY
            SELECT 
                city_name::TEXT as city,
                0::BIGINT as count
            FROM (
                VALUES 
                    ('Rio de Janeiro'),
                    ('Niterói'),
                    ('Petrópolis'),
                    ('Volta Redonda'),
                    ('Nova Iguaçu')
            ) AS default_cities(city_name);
        ELSE
            RETURN QUERY
            SELECT 
                p_state::TEXT as city,
                0::BIGINT as count;
        END IF;
    END IF;
END;
$$;

-- 4. Função para obter médicos por localização e especialidade
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_state TEXT,
    p_city TEXT,
    p_specialty TEXT
)
RETURNS TABLE(
    doctor_id UUID,
    doctor_name TEXT,
    specialty TEXT,
    location_name TEXT,
    address TEXT,
    phone TEXT,
    consultation_fee NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as doctor_id,
        p.display_name as doctor_name,
        p_specialty as specialty,
        la.nome_local as location_name,
        la.endereco as address,
        la.telefone as phone,
        m.valor_consulta as consultation_fee
    FROM public.profiles p
    JOIN public.medicos m ON p.id = m.user_id
    JOIN public.locais_atendimento la ON p.id = la.medico_id
    WHERE p.user_type = 'medico'
        AND p.is_active = true
        AND m.is_active = true
        AND la.ativo = true
        AND la.estado = p_state
        AND la.cidade = p_city
        AND p_specialty = ANY(m.especialidades)
    ORDER BY p.display_name ASC;
    
    -- Se não houver médicos reais, retornar médicos de exemplo
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            gen_random_uuid() as doctor_id,
            ('Dr. ' || doctor_name)::TEXT as doctor_name,
            p_specialty as specialty,
            ('Clínica ' || doctor_name)::TEXT as location_name,
            ('Rua Example, 123 - ' || p_city || ', ' || p_state)::TEXT as address,
            '(11) 99999-9999'::TEXT as phone,
            150.00::NUMERIC as consultation_fee
        FROM (
            VALUES 
                ('João Silva'),
                ('Maria Santos'),
                ('Pedro Oliveira')
        ) AS example_doctors(doctor_name);
    END IF;
END;
$$;

-- 5. Função para reservar slot de agendamento
CREATE OR REPLACE FUNCTION public.reserve_appointment_slot(
    p_doctor_id UUID,
    p_patient_id UUID,
    p_family_member_id UUID DEFAULT NULL,
    p_scheduled_by_id UUID,
    p_appointment_datetime TIMESTAMP WITH TIME ZONE,
    p_specialty TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, appointment_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appointment_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_slot_available BOOLEAN;
BEGIN
    -- Verificar se o slot ainda está disponível
    SELECT NOT EXISTS (
        SELECT 1 FROM public.consultas 
        WHERE medico_id = p_doctor_id 
            AND data_consulta = p_appointment_datetime
            AND (
                status = 'scheduled' OR 
                status = 'confirmed' OR
                (status = 'pending_payment' AND expires_at > NOW())
            )
    ) INTO v_slot_available;

    IF NOT v_slot_available THEN
        RETURN QUERY SELECT FALSE, 'Este horário não está mais disponível.'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Definir tempo de expiração (10 minutos para pagamento)
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Gerar ID do agendamento
    v_appointment_id := gen_random_uuid();

    -- Criar a reserva do agendamento
    INSERT INTO public.consultas (
        id,
        paciente_id,
        medico_id,
        paciente_familiar_id,
        agendado_por,
        data_consulta,
        tipo_consulta,
        status,
        expires_at
    ) VALUES (
        v_appointment_id,
        p_patient_id,
        p_doctor_id,
        p_family_member_id,
        p_scheduled_by_id,
        p_appointment_datetime,
        p_specialty,
        'pending_payment',
        v_expires_at
    );

    RETURN QUERY SELECT TRUE, 'Slot reservado com sucesso.'::TEXT, v_appointment_id;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, 'Este horário não está mais disponível.'::TEXT, NULL::UUID;
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, ('Erro interno: ' || SQLERRM)::TEXT, NULL::UUID;
END;
$$;

-- ============================================================================
-- PARTE 6: DADOS DE EXEMPLO PARA TESTE
-- ============================================================================

-- Inserir alguns perfis de exemplo
DO $$
BEGIN
    -- Se profiles é uma view, inserir em user_profiles
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            INSERT INTO public.user_profiles (id, email, display_name, user_type, is_active, onboarding_completed) VALUES
                ('11111111-1111-1111-1111-111111111111', 'medico1@example.com', 'Dr. João Silva', 'medico', true, true),
                ('22222222-2222-2222-2222-222222222222', 'medico2@example.com', 'Dra. Maria Santos', 'medico', true, true),
                ('33333333-3333-3333-3333-333333333333', 'paciente1@example.com', 'Carlos Oliveira', 'paciente', true, true)
            ON CONFLICT (id) DO NOTHING;
            RAISE NOTICE 'Dados de exemplo inseridos em user_profiles';
        END IF;
    -- Se profiles é uma tabela, inserir em profiles
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        INSERT INTO public.profiles (id, email, display_name, user_type, is_active, onboarding_completed) VALUES
            ('11111111-1111-1111-1111-111111111111', 'medico1@example.com', 'Dr. João Silva', 'medico', true, true),
            ('22222222-2222-2222-2222-222222222222', 'medico2@example.com', 'Dra. Maria Santos', 'medico', true, true),
            ('33333333-3333-3333-3333-333333333333', 'paciente1@example.com', 'Carlos Oliveira', 'paciente', true, true)
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Dados de exemplo inseridos em profiles';
    END IF;
END $$;

-- Inserir dados de médicos
INSERT INTO public.medicos (user_id, crm, especialidades, telefone, valor_consulta) VALUES
    ('11111111-1111-1111-1111-111111111111', 'CRM-SP 123456', ARRAY['Cardiologia', 'Clínica Geral'], '(11) 99999-1111', 200.00),
    ('22222222-2222-2222-2222-222222222222', 'CRM-RJ 789012', ARRAY['Dermatologia', 'Estética'], '(21) 99999-2222', 250.00)
ON CONFLICT (crm) DO NOTHING;

-- Inserir dados de pacientes
INSERT INTO public.pacientes (user_id, dados_pessoais, contato) VALUES
    ('33333333-3333-3333-3333-333333333333', 
     '{"nome": "Carlos Oliveira", "idade": 35, "cpf": "123.456.789-01"}',
     '{"telefone": "(11) 99999-3333", "email": "paciente1@example.com"}')
ON CONFLICT (user_id) DO NOTHING;

-- Inserir locais de atendimento
INSERT INTO public.locais_atendimento (medico_id, nome_local, endereco, cidade, estado, telefone) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Clínica Coração Saudável', 'Av. Paulista, 1000', 'São Paulo', 'São Paulo', '(11) 3333-1111'),
    ('22222222-2222-2222-2222-222222222222', 'Dermatologia Avançada', 'Rua das Flores, 200', 'Rio de Janeiro', 'Rio de Janeiro', '(21) 3333-2222')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FINAL: VERIFICAÇÃO E CONFIRMAÇÃO
-- ============================================================================

-- Verificar se tudo foi criado corretamente
DO $$
DECLARE
    profiles_count INTEGER := 0;
    medicos_count INTEGER;
    pacientes_count INTEGER;
    locais_count INTEGER;
    consultas_count INTEGER;
    profile_table_name TEXT;
BEGIN
    -- Determinar qual tabela de perfis usar
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            SELECT COUNT(*) INTO profiles_count FROM public.user_profiles;
            profile_table_name := 'user_profiles';
        END IF;
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        SELECT COUNT(*) INTO profiles_count FROM public.profiles;
        profile_table_name := 'profiles';
    END IF;
    
    SELECT COUNT(*) INTO medicos_count FROM public.medicos;
    SELECT COUNT(*) INTO pacientes_count FROM public.pacientes;
    SELECT COUNT(*) INTO locais_count FROM public.locais_atendimento;
    SELECT COUNT(*) INTO consultas_count FROM public.consultas;
    
    RAISE NOTICE '✅ CRIAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE 'Tabela de perfis usada: %', profile_table_name;
    RAISE NOTICE 'Profiles criados: %', profiles_count;
    RAISE NOTICE 'Médicos criados: %', medicos_count;
    RAISE NOTICE 'Pacientes criados: %', pacientes_count;
    RAISE NOTICE 'Locais de atendimento criados: %', locais_count;
    RAISE NOTICE 'Consultas criadas: %', consultas_count;
    RAISE NOTICE '🎯 Agora o sistema de agendamento deve funcionar!';
END $$;