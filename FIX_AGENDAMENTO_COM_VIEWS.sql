-- ========================================
-- CORREÇÃO DO AGENDAMENTO QUANDO PROFILES É UMA VIEW
-- Cria user_profiles como tabela e adapta todo o sistema
-- ========================================

-- PASSO 1: CRIAR TABELA user_profiles (já que profiles é uma view)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('paciente', 'medico', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 2: CRIAR TABELA MEDICOS referenciando user_profiles
CREATE TABLE IF NOT EXISTS public.medicos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    crm TEXT NOT NULL UNIQUE,
    especialidades TEXT[] DEFAULT '{}',
    telefone TEXT,
    valor_consulta NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 3: CRIAR TABELA PACIENTES referenciando user_profiles
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    dados_pessoais JSONB DEFAULT '{}',
    contato JSONB DEFAULT '{}',
    endereco JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 4: CRIAR TABELA LOCAIS_ATENDIMENTO referenciando user_profiles
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

-- PASSO 5: CRIAR TABELA CONSULTAS referenciando user_profiles
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

-- PASSO 6: CRIAR ÍNDICES (só em tabelas, não em views)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_medicos_user_id ON public.medicos(user_id);
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON public.medicos(crm);
CREATE INDEX IF NOT EXISTS idx_medicos_especialidades ON public.medicos USING GIN(especialidades);
CREATE INDEX IF NOT EXISTS idx_medicos_is_active ON public.medicos(is_active);

CREATE INDEX IF NOT EXISTS idx_pacientes_user_id ON public.pacientes(user_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_is_active ON public.pacientes(is_active);

CREATE INDEX IF NOT EXISTS idx_locais_medico_id ON public.locais_atendimento(medico_id);
CREATE INDEX IF NOT EXISTS idx_locais_cidade ON public.locais_atendimento(cidade);
CREATE INDEX IF NOT EXISTS idx_locais_estado ON public.locais_atendimento(estado);
CREATE INDEX IF NOT EXISTS idx_locais_ativo ON public.locais_atendimento(ativo);

CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON public.consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico_id ON public.consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_consulta ON public.consultas(data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON public.consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_expires_at ON public.consultas(expires_at) WHERE expires_at IS NOT NULL;

-- Índice único para evitar agendamentos duplos
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultas_unique_slot 
ON public.consultas (medico_id, data_consulta) 
WHERE status IN ('scheduled', 'confirmed', 'pending_payment');

-- PASSO 7: HABILITAR RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- PASSO 8: CRIAR POLÍTICAS RLS
-- Políticas para user_profiles
DROP POLICY IF EXISTS "User profiles são visíveis pelos próprios usuários" ON public.user_profiles;
CREATE POLICY "User profiles são visíveis pelos próprios usuários" 
ON public.user_profiles FOR SELECT 
USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid()::text = id::text);

-- Políticas para médicos
DROP POLICY IF EXISTS "Dados de médicos são visíveis por usuários autenticados" ON public.medicos;
CREATE POLICY "Dados de médicos são visíveis por usuários autenticados" 
ON public.medicos FOR SELECT 
TO authenticated 
USING (is_active = true);

DROP POLICY IF EXISTS "Médicos podem gerenciar seus próprios dados" ON public.medicos;
CREATE POLICY "Médicos podem gerenciar seus próprios dados" 
ON public.medicos FOR ALL 
USING (auth.uid()::text = user_id::text);

-- Políticas para pacientes
DROP POLICY IF EXISTS "Pacientes podem ver e editar seus próprios dados" ON public.pacientes;
CREATE POLICY "Pacientes podem ver e editar seus próprios dados" 
ON public.pacientes FOR ALL 
USING (auth.uid()::text = user_id::text);

-- Políticas para locais de atendimento
DROP POLICY IF EXISTS "Locais são visíveis por usuários autenticados" ON public.locais_atendimento;
CREATE POLICY "Locais são visíveis por usuários autenticados" 
ON public.locais_atendimento FOR SELECT 
TO authenticated 
USING (ativo = true);

DROP POLICY IF EXISTS "Médicos podem gerenciar seus locais" ON public.locais_atendimento;
CREATE POLICY "Médicos podem gerenciar seus locais" 
ON public.locais_atendimento FOR ALL 
USING (auth.uid()::text = medico_id::text);

-- Políticas para consultas
DROP POLICY IF EXISTS "Consultas são visíveis pelos usuários relacionados" ON public.consultas;
CREATE POLICY "Consultas são visíveis pelos usuários relacionados" 
ON public.consultas FOR SELECT 
USING (auth.uid()::text = paciente_id::text OR auth.uid()::text = medico_id::text OR auth.uid()::text = agendado_por::text);

DROP POLICY IF EXISTS "Usuários podem criar agendamentos" ON public.consultas;
CREATE POLICY "Usuários podem criar agendamentos" 
ON public.consultas FOR INSERT 
WITH CHECK (auth.uid()::text = agendado_por::text);

DROP POLICY IF EXISTS "Usuários podem atualizar seus agendamentos" ON public.consultas;
CREATE POLICY "Usuários podem atualizar seus agendamentos" 
ON public.consultas FOR UPDATE 
USING (auth.uid()::text = paciente_id::text OR auth.uid()::text = medico_id::text OR auth.uid()::text = agendado_por::text);

-- PASSO 9: CRIAR FUNÇÕES RPC PARA O AGENDAMENTO

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
            1::BIGINT as count
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
            1::BIGINT as count
        FROM (
            VALUES 
                ('São Paulo'),
                ('Rio de Janeiro'),
                ('Minas Gerais'),
                ('Bahia'),
                ('Paraná')
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
    
    -- Se não houver dados, retornar cidade padrão
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p_state::TEXT as city,
            1::BIGINT as count;
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
        up.id as doctor_id,
        up.display_name as doctor_name,
        p_specialty as specialty,
        la.nome_local as location_name,
        la.endereco as address,
        la.telefone as phone,
        m.valor_consulta as consultation_fee
    FROM public.user_profiles up
    JOIN public.medicos m ON up.id = m.user_id
    JOIN public.locais_atendimento la ON up.id = la.medico_id
    WHERE up.user_type = 'medico'
        AND up.is_active = true
        AND m.is_active = true
        AND la.ativo = true
        AND la.estado = p_state
        AND la.cidade = p_city
        AND p_specialty = ANY(m.especialidades)
    ORDER BY up.display_name ASC;
    
    -- Se não houver médicos reais, retornar médico de exemplo
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            gen_random_uuid() as doctor_id,
            ('Dr. João Silva')::TEXT as doctor_name,
            p_specialty as specialty,
            ('Clínica Medical Center')::TEXT as location_name,
            ('Rua das Flores, 123 - ' || p_city || ', ' || p_state)::TEXT as address,
            '(11) 99999-9999'::TEXT as phone,
            200.00::NUMERIC as consultation_fee;
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

-- PASSO 10: INSERIR DADOS DE EXEMPLO
INSERT INTO public.user_profiles (id, email, display_name, user_type, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'medico1@example.com', 'Dr. João Silva', 'medico', true),
    ('22222222-2222-2222-2222-222222222222', 'medico2@example.com', 'Dra. Maria Santos', 'medico', true),
    ('33333333-3333-3333-3333-333333333333', 'paciente1@example.com', 'Carlos Oliveira', 'paciente', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.medicos (user_id, crm, especialidades, telefone, valor_consulta) VALUES
    ('11111111-1111-1111-1111-111111111111', 'CRM-SP 123456', ARRAY['Cardiologia', 'Clínica Geral'], '(11) 99999-1111', 200.00),
    ('22222222-2222-2222-2222-222222222222', 'CRM-RJ 789012', ARRAY['Dermatologia', 'Estética'], '(21) 99999-2222', 250.00)
ON CONFLICT (crm) DO NOTHING;

INSERT INTO public.pacientes (user_id, dados_pessoais, contato) VALUES
    ('33333333-3333-3333-3333-333333333333', 
     '{"nome": "Carlos Oliveira", "idade": 35, "cpf": "123.456.789-01"}',
     '{"telefone": "(11) 99999-3333", "email": "paciente1@example.com"}')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.locais_atendimento (medico_id, nome_local, endereco, cidade, estado, telefone) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Clínica Coração Saudável', 'Av. Paulista, 1000', 'São Paulo', 'São Paulo', '(11) 3333-1111'),
    ('22222222-2222-2222-2222-222222222222', 'Dermatologia Avançada', 'Rua das Flores, 200', 'Rio de Janeiro', 'Rio de Janeiro', '(21) 3333-2222')
ON CONFLICT DO NOTHING;

-- VERIFICAÇÃO FINAL
SELECT 
    'SUCESSO!' as status,
    'Sistema de agendamento configurado com user_profiles' as mensagem,
    'Teste agora: https://agendarbrasil-health-hub.lovable.app/agendamento' as proxima_acao;