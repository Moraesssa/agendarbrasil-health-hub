-- Fix for medicos table schema cache issue
-- This script ensures the medicos table has the correct structure

-- First, let's check if the table exists and has the correct structure
DO $$
BEGIN
    -- Check if the dados_profissionais column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'medicos' 
        AND column_name = 'dados_profissionais'
    ) THEN
        -- Add the missing column if it doesn't exist
        ALTER TABLE public.medicos 
        ADD COLUMN dados_profissionais JSONB NOT NULL DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added dados_profissionais column to medicos table';
    ELSE
        RAISE NOTICE 'dados_profissionais column already exists in medicos table';
    END IF;
END $$;

-- Ensure all expected columns exist in the medicos table
DO $$
BEGIN
    -- Check and add other potentially missing columns
    
    -- especialidades column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'especialidades'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN especialidades TEXT[] NOT NULL DEFAULT '{}';
        RAISE NOTICE 'Added especialidades column';
    END IF;
    
    -- configuracoes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'configuracoes'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN configuracoes JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added configuracoes column';
    END IF;
    
    -- verificacao column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'verificacao'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN verificacao JSONB NOT NULL DEFAULT '{"crm_verificado": false, "documentos_enviados": false, "aprovado": false}'::jsonb;
        RAISE NOTICE 'Added verificacao column';
    END IF;
    
    -- endereco column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'endereco'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN endereco JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added endereco column';
    END IF;
    
    -- whatsapp column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN whatsapp TEXT;
        RAISE NOTICE 'Added whatsapp column';
    END IF;
    
END $$;

-- Refresh the schema cache by analyzing the table
ANALYZE public.medicos;

-- Display current table structure for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'medicos'
ORDER BY ordinal_position;