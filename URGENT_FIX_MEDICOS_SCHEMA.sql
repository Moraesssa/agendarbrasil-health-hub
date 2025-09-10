-- URGENT FIX: Add missing dados_profissionais column to medicos table
-- Run this in your Supabase SQL Editor Dashboard

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'medicos'
ORDER BY ordinal_position;

-- Step 2: Add the missing dados_profissionais column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'medicos' 
        AND column_name = 'dados_profissionais'
    ) THEN
        ALTER TABLE public.medicos 
        ADD COLUMN dados_profissionais JSONB NOT NULL DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Successfully added dados_profissionais column to medicos table';
    ELSE
        RAISE NOTICE 'dados_profissionais column already exists';
    END IF;
END $$;

-- Step 3: Ensure all other expected columns exist
DO $$
BEGIN
    -- Add configuracoes if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'configuracoes'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN configuracoes JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added configuracoes column';
    END IF;
    
    -- Add verificacao if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'verificacao'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN verificacao JSONB NOT NULL DEFAULT '{"crm_verificado": false, "documentos_enviados": false, "aprovado": false}'::jsonb;
        RAISE NOTICE 'Added verificacao column';
    END IF;
    
    -- Add endereco if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'endereco'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN endereco JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added endereco column';
    END IF;
    
    -- Add especialidades if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'especialidades'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN especialidades TEXT[] NOT NULL DEFAULT '{}';
        RAISE NOTICE 'Added especialidades column';
    END IF;
    
    -- Add whatsapp if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN whatsapp TEXT;
        RAISE NOTICE 'Added whatsapp column';
    END IF;
    
    -- Add registro_especialista if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'registro_especialista'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN registro_especialista TEXT;
        RAISE NOTICE 'Added registro_especialista column';
    END IF;
END $$;

-- Step 4: Verify the final structure
SELECT 'Final table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'medicos'
ORDER BY ordinal_position;