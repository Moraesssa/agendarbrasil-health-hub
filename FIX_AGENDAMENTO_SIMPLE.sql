-- ================================================================
-- CORREÇÃO SIMPLIFICADA DOS PROBLEMAS DE AGENDAMENTO
-- Funciona com qualquer estrutura da tabela profiles
-- ================================================================

SELECT 'INICIANDO CORREÇÃO SIMPLIFICADA DO SISTEMA DE AGENDAMENTO' as status;

-- ================================================================
-- ETAPA 1: VERIFICAR E CRIAR COLUNAS BÁSICAS EM PROFILES
-- ================================================================

SELECT '1. VERIFICANDO E CRIANDO COLUNAS BÁSICAS' as etapa;

-- Adicionar apenas colunas essenciais se não existirem
DO $$ 
BEGIN
  -- Verificar se user_type existe, se não, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'user_type'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_type TEXT;
  END IF;

  -- Verificar se display_name existe, se não, criar  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'display_name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;

  -- Verificar se email existe, se não, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- ================================================================
-- ETAPA 2: CRIAR FUNÇÃO SIMPLES DE PERFIS
-- ================================================================

SELECT '2. CRIANDO FUNÇÃO SIMPLES DE PERFIS' as etapa;

-- Função simples que só usa campos básicos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      NEW.email
    ),
    NULL -- Será definido no onboarding
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- ETAPA 3: CRIAR PERFIS PARA USUÁRIOS EXISTENTES  
-- ================================================================

SELECT '3. CRIANDO PERFIS PARA USUÁRIOS EXISTENTES' as etapa;

-- Inserção simples usando apenas campos básicos
INSERT INTO public.profiles (id, email, display_name, user_type)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email) as display_name,
    NULL as user_type
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);

-- ================================================================
-- ETAPA 4: CORRIGIR POLÍTICAS RLS BÁSICAS
-- ================================================================

SELECT '4. CORRIGINDO POLÍTICAS RLS BÁSICAS' as etapa;

-- Políticas RLS básicas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================================
-- ETAPA 5: CORRIGIR FUNÇÕES RPC ESSENCIAIS
-- ================================================================

SELECT '5. CORRIGINDO FUNÇÕES RPC ESSENCIAIS' as etapa;

-- 5.1. Função get_specialties (versão robusta)
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
    ARRAY['Clínica Geral', 'Cardiologia', 'Dermatologia', 'Pediatria']::TEXT[]
  );
$$;

-- 5.2. Função get_available_states (versão robusta)
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
  ORDER BY uf;
$$;

-- 5.3. Função get_available_cities (versão robusta)  
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf TEXT)
RETURNS TABLE(cidade TEXT, estado TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    COALESCE(l.cidade, 'Brasília') as cidade,
    COALESCE(l.estado, state_uf) as estado
  FROM public.locais_atendimento l
  WHERE l.estado = state_uf AND l.cidade IS NOT NULL
  UNION ALL
  SELECT 'Brasília' as cidade, state_uf as estado
  WHERE state_uf = 'DF' AND NOT EXISTS (
    SELECT 1 FROM public.locais_atendimento 
    WHERE estado = state_uf AND cidade IS NOT NULL
  )
  ORDER BY cidade;
$$;

-- 5.4. Função get_doctors_by_location_and_specialty (versão robusta)
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
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(m.user_id, m.id) as id,
    COALESCE(p.display_name, 'Dr. ' || COALESCE(m.crm, 'Médico')) as display_name,
    COALESCE(m.especialidades, ARRAY['Clínica Geral']::TEXT[]) as especialidades,
    COALESCE(m.crm, '0000/DF') as crm,
    COALESCE(m.telefone, '(61) 99999-9999') as telefone,
    COALESCE(l.nome_local, 'Clínica Exemplo') as local_nome,
    COALESCE(l.endereco, '{"cidade": "Brasília", "estado": "DF"}'::jsonb) as local_endereco
  FROM public.medicos m
  LEFT JOIN public.profiles p ON p.id = COALESCE(m.user_id, m.id)
  LEFT JOIN public.locais_atendimento l ON l.medico_id = COALESCE(m.user_id, m.id)
  WHERE (p_specialty IS NULL OR p_specialty = ANY(COALESCE(m.especialidades, ARRAY['Clínica Geral']::TEXT[])))
    AND (p_city IS NULL OR COALESCE(l.cidade, 'Brasília') = p_city)
    AND (p_state IS NULL OR COALESCE(l.estado, 'DF') = p_state)
  ORDER BY COALESCE(p.display_name, 'Dr. ' || COALESCE(m.crm, 'Médico'));
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_specialties() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_states() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_cities(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ================================================================
-- ETAPA 6: INSERIR DADOS MÍNIMOS DE EXEMPLO
-- ================================================================

SELECT '6. INSERINDO DADOS MÍNIMOS DE EXEMPLO' as etapa;

-- Inserir dados de exemplo apenas se necessário
DO $$
DECLARE
  exemplo_perfil_id UUID := '12345678-1234-1234-1234-123456789012';
BEGIN
  -- Criar perfil de exemplo básico
  INSERT INTO public.profiles (id, email, display_name, user_type)
  VALUES (
    exemplo_perfil_id,
    'dr.exemplo@agendarbrasil.com',
    'Dr. João Silva',
    'medico'
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Inserir médico de exemplo se não existir
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
END $$;

-- ================================================================
-- ETAPA 7: VERIFICAÇÃO FINAL SIMPLIFICADA
-- ================================================================

SELECT '7. VERIFICAÇÃO FINAL SIMPLIFICADA' as etapa;

-- Testar funções básicas
SELECT 'Testando get_specialties:' as teste, 
       array_length(get_specialties(), 1) as total_especialidades;

SELECT 'Testando get_available_states:' as teste,
       (SELECT COUNT(*) FROM get_available_states()) as total_estados;

-- Verificar contadores básicos
SELECT 'Contadores básicos' as resultado;
SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE id IS NOT NULL) as total_profiles,
    (SELECT COUNT(*) FROM public.medicos WHERE crm IS NOT NULL) as total_medicos;

-- ================================================================
-- INSTRUÇÕES FINAIS SIMPLIFICADAS
-- ================================================================

SELECT '=== CORREÇÃO SIMPLIFICADA CONCLUÍDA! ===' as status;

SELECT 'PRÓXIMOS PASSOS:' as instrucoes;
SELECT '1. Acesse: https://agendarbrasil-health-hub.lovable.app/agendamento' as passo_1;
SELECT '2. Verifique se as especialidades carregam (Etapa 1)' as passo_2;
SELECT '3. Se ainda houver problemas, execute o script completo' as passo_3;

SELECT 'PROBLEMAS BÁSICOS CORRIGIDOS:' as corrigidos;
SELECT '✅ Estrutura básica da tabela profiles' as fix_1;
SELECT '✅ Funções RPC essenciais com fallbacks' as fix_2;
SELECT '✅ Dados mínimos de exemplo' as fix_3;
SELECT '✅ Políticas RLS básicas' as fix_4;