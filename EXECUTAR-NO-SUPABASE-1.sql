-- SCRIPT 1: CORRIGIR POLÍTICAS RLS
-- Copie e execute este código no Supabase SQL Editor

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "medicos_select_policy" ON public.medicos;
DROP POLICY IF EXISTS "medicos_public_read" ON public.medicos;
DROP POLICY IF EXISTS "locais_select_policy" ON public.locais_atendimento;
DROP POLICY IF EXISTS "locais_public_read" ON public.locais_atendimento;

-- Criar políticas públicas para leitura (permitir acesso anônimo)
CREATE POLICY "medicos_public_select" ON public.medicos
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "locais_public_select" ON public.locais_atendimento
    FOR SELECT
    TO public
    USING (true);

-- Verificar se as políticas foram criadas
SELECT 
    tablename,
    policyname,
    cmd as operacao
FROM pg_policies 
WHERE tablename IN ('medicos', 'locais_atendimento')
ORDER BY tablename, policyname;