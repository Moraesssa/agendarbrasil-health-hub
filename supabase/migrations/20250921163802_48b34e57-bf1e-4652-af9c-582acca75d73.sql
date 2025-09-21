-- CORREÇÃO EMERGENCIAL DE SEGURANÇA RLS
-- Ativar RLS nas tabelas principais que estão sem proteção

-- 1. Ativar RLS em tabelas críticas
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais_atendimento ENABLE ROW LEVEL SECURITY;

-- 2. Criar função de validação UUID para evitar erros "undefined"
CREATE OR REPLACE FUNCTION safe_uuid_or_null(input_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se é NULL, string vazia, ou valores inválidos comuns
  IF input_text IS NULL 
     OR input_text = '' 
     OR input_text = 'undefined' 
     OR input_text = 'null' 
     OR LENGTH(input_text) != 36 THEN
    RETURN NULL;
  END IF;
  
  -- Tentar converter para UUID
  BEGIN
    RETURN input_text::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;
END;
$$;

-- 3. Criar políticas RLS básicas permissivas para não quebrar o sistema
CREATE POLICY "medicos_authenticated_access" ON public.medicos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pacientes_authenticated_access" ON public.pacientes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "locais_authenticated_read" ON public.locais_atendimento
  FOR SELECT TO authenticated
  USING (ativo = true);

CREATE POLICY "locais_owner_manage" ON public.locais_atendimento
  FOR ALL TO authenticated
  USING (auth.uid() = medico_id)
  WITH CHECK (auth.uid() = medico_id);

-- 4. Comentários para documentação
COMMENT ON FUNCTION safe_uuid_or_null(text) IS 'Valida UUID e retorna NULL se inválido, evitando erros "undefined"';
COMMENT ON POLICY "medicos_authenticated_access" ON public.medicos IS 'Acesso temporário permissivo - refinar após testes';
COMMENT ON POLICY "pacientes_authenticated_access" ON public.pacientes IS 'Acesso temporário permissivo - refinar após testes';