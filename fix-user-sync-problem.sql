-- ========================================
-- CORREÇÃO COMPLETA DO PROBLEMA DE USUÁRIOS "PRESOS"
-- MANTENDO RLS DESABILITADO CONFORME SOLICITADO
-- ========================================

-- PASSO 1: GARANTIR QUE RLS ESTÁ DESABILITADO EM TODAS AS TABELAS
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consultas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locais_atendimento DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pagamentos DISABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can manage own data" ON public.medicos;
DROP POLICY IF EXISTS "Public can view active doctors" ON public.medicos;
DROP POLICY IF EXISTS "Patients can manage own data" ON public.pacientes;
DROP POLICY IF EXISTS "Users can view related appointments" ON public.consultas;
DROP POLICY IF EXISTS "Users can create appointments" ON public.consultas;
DROP POLICY IF EXISTS "Doctors can manage own locations" ON public.locais_atendimento;
DROP POLICY IF EXISTS "Public can view active locations" ON public.locais_atendimento;

-- PASSO 3: CRIAR FUNÇÃO DE SINCRONIZAÇÃO DE USUÁRIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: CRIAR TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASSO 5: SINCRONIZAR USUÁRIOS EXISTENTES NA AUTENTICAÇÃO
INSERT INTO public.profiles (id, email, display_name, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)) as display_name,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- PASSO 6: CORRIGIR ESTRUTURA DAS TABELAS PRINCIPAIS
-- Adicionar campos faltantes na tabela medicos
ALTER TABLE public.medicos 
ADD COLUMN IF NOT EXISTS aceita_teleconsulta BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS aceita_consulta_presencial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS valor_consulta_teleconsulta NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_consulta_presencial NUMERIC(10,2);

-- Adicionar campos faltantes na tabela pacientes  
ALTER TABLE public.pacientes
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- PASSO 7: CONFIRMAR QUE RLS ESTÁ DESABILITADO (CONFORME SOLICITADO)
-- Não criamos políticas RLS pois o sistema deve funcionar sem elas

-- PASSO 8: CRIAR ÍNDICES PARA PERFORMANCE (SEM RLS)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_medicos_user_id ON public.medicos(user_id);
CREATE INDEX IF NOT EXISTS idx_medicos_active ON public.medicos(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pacientes_user_id ON public.pacientes(user_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico_id ON public.consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON public.consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_locais_medico_id ON public.locais_atendimento(medico_id);
CREATE INDEX IF NOT EXISTS idx_locais_ativo ON public.locais_atendimento(ativo) WHERE ativo = true;

-- PASSO 12: INSERIR DADOS DE EXEMPLO PARA TESTE
DO $$
DECLARE
  test_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Inserir médico de exemplo
  INSERT INTO public.medicos (
    id, user_id, crm, especialidades, telefone, 
    valor_consulta_teleconsulta, valor_consulta_presencial,
    aceita_teleconsulta, aceita_consulta_presencial, is_active
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'CRM-SP 123456',
    ARRAY['Cardiologia', 'Clínica Geral'],
    '(11) 99999-1111',
    200.00,
    250.00,
    true,
    true,
    true
  ) ON CONFLICT DO NOTHING;

  -- Inserir local de atendimento
  INSERT INTO public.locais_atendimento (
    medico_id, nome_local, endereco, cidade, estado, telefone, ativo
  ) VALUES (
    test_user_id,
    'Clínica Coração Saudável',
    'Av. Paulista, 1000',
    'São Paulo',
    'São Paulo',
    '(11) 3333-1111',
    true
  ) ON CONFLICT DO NOTHING;
END $$;

-- PASSO 9: VERIFICAÇÃO FINAL
SELECT 
  'CORREÇÃO APLICADA COM SUCESSO!' as status,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  'RLS DESABILITADO conforme solicitado' as security_status;