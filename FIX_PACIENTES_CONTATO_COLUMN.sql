-- =====================================================
-- FIX: Add missing 'contato' column to pacientes table
-- =====================================================
-- This fixes the error: "Erro ao salvar dados do paciente"
-- that occurs during patient onboarding

-- Check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pacientes' 
        AND column_name = 'contato'
    ) THEN
        -- Add the missing column
        ALTER TABLE public.pacientes 
        ADD COLUMN contato jsonb DEFAULT '{}';
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.pacientes.contato IS 'Contact information including phone, whatsapp, emergency contacts, etc.';
        
        RAISE NOTICE 'Successfully added contato column to pacientes table';
    ELSE
        RAISE NOTICE 'Column contato already exists in pacientes table';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pacientes'
ORDER BY ordinal_position;