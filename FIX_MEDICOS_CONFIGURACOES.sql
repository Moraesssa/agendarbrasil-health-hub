-- Adicionar coluna configuracoes na tabela medicos se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'configuracoes') THEN
        ALTER TABLE public.medicos ADD COLUMN configuracoes JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna configuracoes adicionada na tabela medicos';
    ELSE
        RAISE NOTICE 'Coluna configuracoes já existe na tabela medicos';
    END IF;
END $$;
