# 🔧 INSTRUÇÕES PARA APLICAR NO SUPABASE DASHBOARD

## 📍 ONDE APLICAR:
1. Acesse seu **Supabase Dashboard**
2. Vá em **SQL Editor** 
3. Cole e execute cada bloco SQL abaixo **UM POR VEZ**

---

## 🚨 CORREÇÃO 1: CRIAR FUNÇÃO DE SINCRONIZAÇÃO (CRÍTICO!)

```sql
-- Criar função para sincronizar usuários automaticamente
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
```

**✅ Execute este bloco primeiro e verifique se não há erros**

---

## 🚨 CORREÇÃO 2: CRIAR TRIGGER (CRÍTICO!)

```sql
-- Remover trigger existente (se houver) e criar novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**✅ Execute este bloco e verifique se não há erros**

---

## 🔧 CORREÇÃO 3: ADICIONAR CAMPOS FALTANTES NA TABELA MEDICOS

```sql
-- Adicionar campos que estão faltando na tabela medicos
ALTER TABLE public.medicos 
ADD COLUMN IF NOT EXISTS especialidades TEXT[],
ADD COLUMN IF NOT EXISTS aceita_teleconsulta BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS aceita_consulta_presencial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS valor_consulta_teleconsulta NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_consulta_presencial NUMERIC(10,2);
```

**✅ Execute este bloco**

---

## 🔧 CORREÇÃO 4: ADICIONAR CAMPOS FALTANTES NA TABELA PACIENTES

```sql
-- Adicionar campo is_active na tabela pacientes
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

**✅ Execute este bloco**

---

## 🔧 CORREÇÃO 5: ADICIONAR CAMPOS FALTANTES NA TABELA LOCAIS_ATENDIMENTO

```sql
-- Adicionar campos que podem estar faltando
ALTER TABLE public.locais_atendimento 
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS nome_local TEXT;

-- Renomear coluna se necessário (pode dar erro, é normal)
ALTER TABLE public.locais_atendimento 
RENAME COLUMN nome TO nome_local;
```

**✅ Execute este bloco (pode dar alguns erros, é normal)**

---

## 📊 CORREÇÃO 6: SINCRONIZAR USUÁRIOS EXISTENTES

```sql
-- Sincronizar usuários que já existem na autenticação mas não estão em profiles
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

**✅ Execute este bloco**

---

## 🧪 CORREÇÃO 7: INSERIR DADOS DE TESTE (CORRIGIDO)

```sql
-- Primeiro, vamos verificar a estrutura da tabela medicos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medicos' AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Execute primeiro para ver a estrutura, depois:**

```sql
-- Inserir médico de exemplo (SEM campo id se for auto-increment)
INSERT INTO public.medicos (
  user_id, crm, especialidades, telefone, 
  valor_consulta_teleconsulta, valor_consulta_presencial,
  aceita_teleconsulta, aceita_consulta_presencial, is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'CRM-SP 123456',
  ARRAY['Cardiologia', 'Clínica Geral'],
  '(11) 99999-1111',
  200.00,
  250.00,
  true,
  true,
  true
) ON CONFLICT DO NOTHING;
```

**Se der erro, tente esta versão alternativa:**

```sql
-- Versão alternativa se id for bigint auto-increment
INSERT INTO public.medicos (
  user_id, crm, especialidades, telefone, 
  valor_consulta_teleconsulta, valor_consulta_presencial,
  aceita_teleconsulta, aceita_consulta_presencial, is_active
) 
SELECT 
  '11111111-1111-1111-1111-111111111111',
  'CRM-SP 123456',
  ARRAY['Cardiologia', 'Clínica Geral'],
  '(11) 99999-1111',
  200.00,
  250.00,
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.medicos 
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
);
```

**Para o local de atendimento:**

```sql
-- Verificar estrutura da tabela locais_atendimento
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'locais_atendimento' AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Depois inserir o local:**

```sql
-- Inserir local de atendimento (ajustado)
INSERT INTO public.locais_atendimento (
  medico_id, nome_local, endereco, cidade, estado, telefone, ativo
) 
SELECT 
  '11111111-1111-1111-1111-111111111111',
  'Clínica Coração Saudável',
  'Av. Paulista, 1000',
  'São Paulo',
  'São Paulo',
  '(11) 3333-1111',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.locais_atendimento 
  WHERE medico_id = '11111111-1111-1111-1111-111111111111'
);
```

**✅ Execute este bloco**

---

## 🔍 VERIFICAÇÃO FINAL

```sql
-- Verificar se tudo funcionou
SELECT 
  'CORREÇÕES APLICADAS!' as status,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.medicos) as medicos_count,
  (SELECT COUNT(*) FROM public.locais_atendimento) as locais_count;
```

**✅ Execute este bloco para verificar**

---

## 🧪 TESTE FINAL

Após aplicar todas as correções:

1. **Vá para Authentication > Users** no Supabase Dashboard
2. **Crie um novo usuário** manualmente ou via código
3. **Verifique** se ele aparece automaticamente na tabela `profiles`

---

## ❗ IMPORTANTE

- Execute **UM BLOCO POR VEZ**
- Verifique se não há erros antes de continuar
- Alguns erros são normais (campos que já existem)
- O mais importante são as **CORREÇÕES 1 e 2** (função e trigger)

---

## 📞 APÓS APLICAR

Me avise quando terminar para testarmos se funcionou!