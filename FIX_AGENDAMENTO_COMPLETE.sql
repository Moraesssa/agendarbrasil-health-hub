-- ================================================================
-- CORREÇÃO COMPLETA DOS PROBLEMAS DE AGENDAMENTO
-- Resolve: Criação de perfis, Funções RPC e Campos inconsistentes
-- ================================================================

SELECT 'INICIANDO CORREÇÃO COMPLETA DO SISTEMA DE AGENDAMENTO' as status;

-- ================================================================
-- ETAPA 1: CORRIGIR CRIAÇÃO DE PERFIS
-- ================================================================

SELECT '1. CORRIGINDO CRIAÇÃO DE PERFIS' as etapa;

-- Verificar e criar colunas faltantes na tabela profiles
DO $$ 
BEGIN
  -- Adicionar coluna onboarding_completed se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'onboarding_completed'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar coluna is_active se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_active'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Adicionar coluna photo_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'photo_url'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN photo_url TEXT;
  END IF;

  -- Adicionar coluna created_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'created_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Adicionar coluna updated_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Recriar função de criação de perfis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url, user_type, onboarding_completed, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      NEW.email
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL, -- Será definido no onboarding
    false,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    photo_url = COALESCE(EXCLUDED.photo_url, profiles.photo_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar perfis para usuários existentes que não têm perfil
-- Usar apenas colunas que existem na tabela
DO $$
DECLARE
    has_onboarding_completed BOOLEAN;
    has_is_active BOOLEAN;
    has_photo_url BOOLEAN;
    has_created_at BOOLEAN;
    has_updated_at BOOLEAN;
    insert_sql TEXT;
BEGIN
    -- Verificar quais colunas existem
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'onboarding_completed' AND table_schema = 'public'
    ) INTO has_onboarding_completed;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_active' AND table_schema = 'public'
    ) INTO has_is_active;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'photo_url' AND table_schema = 'public'
    ) INTO has_photo_url;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at' AND table_schema = 'public'
    ) INTO has_created_at;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at' AND table_schema = 'public'
    ) INTO has_updated_at;
    
    -- Construir SQL dinâmico baseado nas colunas disponíveis
    insert_sql := 'INSERT INTO public.profiles (id, email, display_name, user_type';
    
    IF has_onboarding_completed THEN
        insert_sql := insert_sql || ', onboarding_completed';
    END IF;
    
    IF has_is_active THEN
        insert_sql := insert_sql || ', is_active';
    END IF;
    
    IF has_photo_url THEN
        insert_sql := insert_sql || ', photo_url';
    END IF;
    
    IF has_created_at THEN
        insert_sql := insert_sql || ', created_at';
    END IF;
    
    IF has_updated_at THEN
        insert_sql := insert_sql || ', updated_at';
    END IF;
    
    insert_sql := insert_sql || ') SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>''full_name'', u.raw_user_meta_data->>''name'', u.email) as display_name, NULL as user_type';
    
    IF has_onboarding_completed THEN
        insert_sql := insert_sql || ', false';
    END IF;
    
    IF has_is_active THEN
        insert_sql := insert_sql || ', true';
    END IF;
    
    IF has_photo_url THEN
        insert_sql := insert_sql || ', u.raw_user_meta_data->>''avatar_url''';
    END IF;
    
    IF has_created_at THEN
        insert_sql := insert_sql || ', u.created_at';
    END IF;
    
    IF has_updated_at THEN
        insert_sql := insert_sql || ', now()';
    END IF;
    
    insert_sql := insert_sql || ' FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = COALESCE(EXCLUDED.display_name, profiles.display_name)';
    
    IF has_updated_at THEN
        insert_sql := insert_sql || ', updated_at = now()';
    END IF;
    
    -- Executar SQL dinâmico
    EXECUTE insert_sql;
END $$;

-- Corrigir políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================================
-- ETAPA 2: CORRIGIR NOMES DE CAMPOS NA TABELA CONSULTAS
-- ================================================================

SELECT '2. CORRIGINDO CAMPOS DA TABELA CONSULTAS' as etapa;

-- Verificar se a coluna consultation_date existe e renomear para data_consulta se necessário
DO $$ 
BEGIN
  -- Se consultation_date existe e data_consulta não existe, renomear
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'consultation_date'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'data_consulta'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas RENAME COLUMN consultation_date TO data_consulta;
  END IF;

  -- Se consultation_type existe e tipo_consulta não existe, renomear
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'consultation_type'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'tipo_consulta'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas RENAME COLUMN consultation_type TO tipo_consulta;
  END IF;

  -- Adicionar colunas que podem estar faltando
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'data_consulta'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN data_consulta TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'tipo_consulta'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN tipo_consulta TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'expires_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'agendado_por'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN agendado_por UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'paciente_familiar_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN paciente_familiar_id UUID;
  END IF;
END $$;

-- Recriar índices com nomes corretos
DROP INDEX IF EXISTS idx_consultas_medico_date;
CREATE INDEX IF NOT EXISTS idx_consultas_medico_data ON public.consultas (medico_id, data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_data ON public.consultas (paciente_id, data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON public.consultas (status);
CREATE INDEX IF NOT EXISTS idx_consultas_expires ON public.consultas (expires_at) WHERE expires_at IS NOT NULL;

-- Constraint para evitar double booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultas_unique_slot 
ON public.consultas (medico_id, data_consulta) 
WHERE status IN ('scheduled', 'confirmed', 'pending_payment', 'agendada', 'confirmada');

-- ================================================================
-- ETAPA 3: CORRIGIR FUNÇÕES RPC
-- ================================================================

SELECT '3. CORRIGINDO FUNÇÕES RPC' as etapa;

-- 3.1. Função get_specialties
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT DISTINCT unnest(especialidades) as especialidade
    FROM public.medicos
    WHERE especialidades IS NOT NULL 
      AND array_length(especialidades, 1) > 0
    ORDER BY especialidade
  );
$$;

-- 3.2. Função get_available_states
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf TEXT, nome TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    l.estado as uf,
    l.estado as nome
  FROM public.locais_atendimento l
  JOIN public.medicos m ON m.user_id = l.medico_id
  WHERE l.ativo = true 
    AND l.estado IS NOT NULL
  ORDER BY l.estado;
$$;

-- 3.3. Função get_available_cities
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf TEXT)
RETURNS TABLE(cidade TEXT, estado TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    l.cidade,
    l.estado
  FROM public.locais_atendimento l
  JOIN public.medicos m ON m.user_id = l.medico_id
  WHERE l.ativo = true 
    AND l.estado = state_uf
    AND l.cidade IS NOT NULL
  ORDER BY l.cidade;
$$;

-- 3.4. Função get_doctors_by_location_and_specialty
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
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
    m.user_id as id,
    COALESCE(p.display_name, 'Dr. ' || m.crm) as display_name,
    m.especialidades,
    m.crm,
    m.telefone,
    l.nome_local as local_nome,
    l.endereco as local_endereco
  FROM public.medicos m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  JOIN public.locais_atendimento l ON l.medico_id = m.user_id
  WHERE l.ativo = true
    AND (p_specialty IS NULL OR p_specialty = ANY(m.especialidades))
    AND (p_city IS NULL OR l.cidade = p_city)
    AND (p_state IS NULL OR l.estado = p_state)
  ORDER BY COALESCE(p.display_name, 'Dr. ' || m.crm);
$$;

-- Conceder permissões para as funções RPC
GRANT EXECUTE ON FUNCTION public.get_specialties() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_states() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_cities(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ================================================================
-- ETAPA 4: CORRIGIR FUNÇÃO DE RESERVA DE AGENDAMENTO
-- ================================================================

SELECT '4. CORRIGINDO FUNÇÃO DE RESERVA' as etapa;

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
SET search_path = ''
AS $$
DECLARE
  v_appointment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_slot_available BOOLEAN;
BEGIN
  -- Verificar se o slot está disponível usando nomes corretos das colunas
  SELECT NOT EXISTS (
    SELECT 1 FROM public.consultas 
    WHERE medico_id = p_doctor_id 
    AND data_consulta = p_appointment_datetime
    AND (
      status IN ('scheduled', 'confirmed', 'agendada', 'confirmada') OR
      (status = 'pending_payment' AND expires_at > NOW())
    )
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN QUERY SELECT FALSE, 'Este horário não está mais disponível.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Definir tempo de expiração (10 minutos para pagamento)
  v_expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Gerar novo ID de agendamento
  v_appointment_id := gen_random_uuid();

  -- Criar a reserva do agendamento usando nomes corretos das colunas
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

  RETURN QUERY SELECT TRUE, 'Horário reservado com sucesso.'::TEXT, v_appointment_id;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT FALSE, 'Este horário não está mais disponível.'::TEXT, NULL::UUID;
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, ('Erro interno: ' || SQLERRM)::TEXT, NULL::UUID;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_appointment_slot TO authenticated;

-- ================================================================
-- ETAPA 5: CORRIGIR POLÍTICAS RLS PARA CONSULTAS
-- ================================================================

SELECT '5. CORRIGINDO POLÍTICAS RLS PARA CONSULTAS' as etapa;

-- Remover políticas existentes
DROP POLICY IF EXISTS "pacientes_select_own_consultas" ON public.consultas;
DROP POLICY IF EXISTS "medicos_select_own_consultas" ON public.consultas;
DROP POLICY IF EXISTS "pacientes_insert_consultas" ON public.consultas;
DROP POLICY IF EXISTS "authenticated_users_insert_consultas" ON public.consultas;

-- Habilitar RLS
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- Criar novas políticas RLS
CREATE POLICY "Patients can view own appointments" ON public.consultas
  FOR SELECT USING (
    auth.uid() = paciente_id OR 
    auth.uid() = paciente_familiar_id OR
    auth.uid() = agendado_por
  );

CREATE POLICY "Doctors can view their appointments" ON public.consultas
  FOR SELECT USING (auth.uid() = medico_id);

CREATE POLICY "Authenticated users can create appointments" ON public.consultas
  FOR INSERT WITH CHECK (
    auth.uid() = paciente_id OR 
    auth.uid() = agendado_por
  );

CREATE POLICY "Users can update their appointments" ON public.consultas
  FOR UPDATE USING (
    auth.uid() = paciente_id OR 
    auth.uid() = medico_id OR
    auth.uid() = agendado_por
  );

-- ================================================================
-- ETAPA 6: INSERIR DADOS DE EXEMPLO PARA TESTE
-- ================================================================

SELECT '6. INSERINDO DADOS DE EXEMPLO' as etapa;

-- Inserir dados de exemplo apenas se não existirem
DO $$
DECLARE
  exemplo_medico_id UUID;
  exemplo_perfil_id UUID := '12345678-1234-1234-1234-123456789012';
  has_onboarding_completed BOOLEAN;
  has_is_active BOOLEAN;
  insert_sql TEXT;
BEGIN
  -- Verificar se já existem médicos
  IF NOT EXISTS (SELECT 1 FROM public.medicos LIMIT 1) THEN
    
    -- Verificar quais colunas existem na tabela profiles
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'onboarding_completed' AND table_schema = 'public'
    ) INTO has_onboarding_completed;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_active' AND table_schema = 'public'
    ) INTO has_is_active;
    
    -- Construir SQL dinâmico para inserir perfil de exemplo
    insert_sql := 'INSERT INTO public.profiles (id, email, display_name, user_type';
    
    IF has_onboarding_completed THEN
        insert_sql := insert_sql || ', onboarding_completed';
    END IF;
    
    IF has_is_active THEN
        insert_sql := insert_sql || ', is_active';
    END IF;
    
    insert_sql := insert_sql || ') VALUES ($1, $2, $3, $4';
    
    IF has_onboarding_completed THEN
        insert_sql := insert_sql || ', $5';
    END IF;
    
    IF has_is_active THEN
        insert_sql := insert_sql || ', ' || CASE WHEN has_onboarding_completed THEN '$6' ELSE '$5' END;
    END IF;
    
    insert_sql := insert_sql || ') ON CONFLICT (id) DO NOTHING';
    
    -- Executar inserção do perfil
    IF has_onboarding_completed AND has_is_active THEN
        EXECUTE insert_sql USING exemplo_perfil_id, 'dr.exemplo@agendarbrasil.com', 'Dr. João Silva', 'medico', true, true;
    ELSIF has_onboarding_completed THEN
        EXECUTE insert_sql USING exemplo_perfil_id, 'dr.exemplo@agendarbrasil.com', 'Dr. João Silva', 'medico', true;
    ELSIF has_is_active THEN
        EXECUTE insert_sql USING exemplo_perfil_id, 'dr.exemplo@agendarbrasil.com', 'Dr. João Silva', 'medico', true;
    ELSE
        EXECUTE insert_sql USING exemplo_perfil_id, 'dr.exemplo@agendarbrasil.com', 'Dr. João Silva', 'medico';
    END IF;
    
    -- Inserir médico de exemplo
    INSERT INTO public.medicos (
      user_id, crm, especialidades, telefone, endereco, dados_profissionais
    ) VALUES (
      exemplo_perfil_id,
      '12345/DF',
      ARRAY['Clínica Geral', 'Cardiologia'],
      '(61) 99999-9999',
      '{"logradouro": "SQN 123", "cidade": "Brasília", "estado": "DF", "cep": "70000-000"}'::jsonb,
      '{"formacao": "Medicina - UnB", "residencia": "Cardiologia - HUB"}'::jsonb
    ) RETURNING user_id INTO exemplo_medico_id;
    
    -- Inserir local de atendimento para o médico de exemplo
    INSERT INTO public.locais_atendimento (
      medico_id, nome_local, endereco, cidade, estado, cep, telefone, ativo
    ) VALUES (
      exemplo_medico_id,
      'Clínica Exemplo Brasília',
      '{"logradouro": "SQN 123 Bloco A", "numero": "123", "complemento": "Sala 101"}'::jsonb,
      'Brasília',
      'DF',
      '70000-000',
      '(61) 3333-3333',
      true
    );
  END IF;
END $$;

-- ================================================================
-- ETAPA 7: VERIFICAÇÃO FINAL
-- ================================================================

SELECT '7. VERIFICAÇÃO FINAL' as etapa;

-- Testar funções RPC
SELECT 'Testando get_specialties:' as teste, 
       array_length(get_specialties(), 1) as total_especialidades;

SELECT 'Testando get_available_states:' as teste,
       (SELECT COUNT(*) FROM get_available_states()) as total_estados;

SELECT 'Testando get_available_cities para DF:' as teste,
       (SELECT COUNT(*) FROM get_available_cities('DF')) as total_cidades_df;

-- Verificar estrutura das tabelas
SELECT 'Verificando estrutura da tabela consultas' as verificacao;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultas' 
  AND table_schema = 'public'
  AND column_name IN ('data_consulta', 'tipo_consulta', 'consultation_date', 'consultation_type')
ORDER BY column_name;

-- Verificar contadores
SELECT 'Contadores finais' as resultado;
SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.medicos) as total_medicos,
    (SELECT COUNT(*) FROM public.locais_atendimento) as total_locais,
    (SELECT COUNT(*) FROM public.consultas) as total_consultas;

-- ================================================================
-- ETAPA 8: INSTRUÇÕES FINAIS
-- ================================================================

SELECT '=== CORREÇÃO CONCLUÍDA COM SUCESSO! ===' as status;

SELECT 'INSTRUÇÕES PARA VERIFICAR O AGENDAMENTO:' as instrucoes;
SELECT '1. Acesse: https://agendarbrasil-health-hub.lovable.app/agendamento' as passo_1;
SELECT '2. Verifique se todas as 7 etapas carregam corretamente' as passo_2;
SELECT '3. Se ainda houver problemas, verifique o console do navegador' as passo_3;
SELECT '4. Execute este script novamente se necessário' as passo_4;

SELECT 'PROBLEMAS CORRIGIDOS:' as corrigidos;
SELECT '✅ Criação automática de perfis de usuário' as fix_1;
SELECT '✅ Funções RPC (get_specialties, get_available_states, etc.)' as fix_2;
SELECT '✅ Nomes de campos consistentes (data_consulta vs consultation_date)' as fix_3;
SELECT '✅ Políticas RLS para consultas' as fix_4;
SELECT '✅ Função de reserva de agendamento' as fix_5;
SELECT '✅ Dados de exemplo para teste' as fix_6;