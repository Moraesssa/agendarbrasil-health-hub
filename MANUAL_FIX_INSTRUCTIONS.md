# 🔧 CORREÇÃO MANUAL - USUÁRIOS "PRESOS"

## ⚠️ APLICAR NO SUPABASE DASHBOARD - SQL EDITOR

### PASSO 1: HABILITAR RLS (CRÍTICO!)
```sql
-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid()::text = id::text);
```

### PASSO 2: CRIAR TRIGGER DE SINCRONIZAÇÃO
```sql
-- Função para sincronizar novos usuários
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

-- Trigger para executar a função
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### PASSO 3: SINCRONIZAR USUÁRIOS EXISTENTES
```sql
-- Sincronizar usuários que já existem na autenticação
INSERT INTO public.profiles (id, email, display_name, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)) as display_name,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

### PASSO 4: CORRIGIR ESTRUTURA DAS TABELAS
```sql
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
```

### PASSO 5: HABILITAR RLS EM TODAS AS TABELAS
```sql
-- Habilitar RLS
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais_atendimento ENABLE ROW LEVEL SECURITY;

-- Políticas para médicos
CREATE POLICY "Doctors can manage own data" 
ON public.medicos FOR ALL 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view active doctors" 
ON public.medicos FOR SELECT 
TO authenticated
USING (is_active = true);

-- Políticas para pacientes
CREATE POLICY "Patients can manage own data" 
ON public.pacientes FOR ALL 
USING (auth.uid()::text = user_id::text);

-- Políticas para consultas
CREATE POLICY "Users can view related appointments" 
ON public.consultas FOR SELECT 
USING (
  auth.uid()::text = medico_id::text OR 
  auth.uid()::text = paciente_id::text
);

-- Políticas para locais
CREATE POLICY "Doctors can manage own locations" 
ON public.locais_atendimento FOR ALL 
USING (auth.uid()::text = medico_id::text);

CREATE POLICY "Public can view active locations" 
ON public.locais_atendimento FOR SELECT 
TO authenticated
USING (ativo = true);
```

### PASSO 6: VERIFICAÇÃO
```sql
-- Verificar se a correção funcionou
SELECT 
  'CORREÇÃO APLICADA!' as status,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count;
```

## 🧪 TESTE APÓS APLICAR A CORREÇÃO:

1. **Criar novo usuário** via Supabase Auth
2. **Verificar** se aparece automaticamente na tabela `profiles`
3. **Testar** se RLS está bloqueando acesso não autorizado

## ✅ RESULTADO ESPERADO:

- ✅ Usuários novos sincronizam automaticamente
- ✅ RLS protege dados sensíveis
- ✅ Tabelas principais funcionais
- ✅ SchedulingService corrigido e funcional