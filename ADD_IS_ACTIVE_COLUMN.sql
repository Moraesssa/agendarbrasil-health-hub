-- SCRIPT PARA CORRIGIR A ESTRUTURA DA TABELA
-- Adiciona a coluna `is_active` que está faltando na tabela `locais_atendimento`.

-- Adiciona a coluna 'is_active' apenas se ela não existir,
-- com um valor padrão 'true' para não quebrar os locais existentes.
ALTER TABLE public.locais_atendimento
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Garante que todos os registros existentes tenham um valor não-nulo.
UPDATE public.locais_atendimento
SET is_active = true
WHERE is_active IS NULL;

SELECT 'Coluna is_active adicionada com sucesso à tabela locais_atendimento.' as status;
