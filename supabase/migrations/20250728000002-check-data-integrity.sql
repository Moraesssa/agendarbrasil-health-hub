-- Verificar integridade dos dados antes de aplicar foreign keys
-- Esta migração identifica e corrige problemas de integridade referencial

-- Verificar consultas com medico_id que não existe em profiles
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM public.consultas c
    LEFT JOIN public.profiles p ON c.medico_id = p.id
    WHERE c.medico_id IS NOT NULL AND p.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontradas % consultas com medico_id órfão', orphaned_count;
        
        -- Opção 1: Remover consultas órfãs (CUIDADO!)
        -- DELETE FROM public.consultas 
        -- WHERE medico_id NOT IN (SELECT id FROM public.profiles);
        
        -- Opção 2: Criar profiles temporários para médicos órfãos
        INSERT INTO public.profiles (id, email, display_name, user_type, is_active)
        SELECT DISTINCT 
            c.medico_id,
            'medico_' || c.medico_id || '@temp.com',
            'Médico Temporário',
            'medico',
            false
        FROM public.consultas c
        LEFT JOIN public.profiles p ON c.medico_id = p.id
        WHERE c.medico_id IS NOT NULL AND p.id IS NULL
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Criados profiles temporários para médicos órfãos';
    ELSE
        RAISE NOTICE 'Nenhuma consulta órfã encontrada';
    END IF;
END $$;

-- Verificar consultas com paciente_id que não existe em profiles
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM public.consultas c
    LEFT JOIN public.profiles p ON c.paciente_id = p.id
    WHERE c.paciente_id IS NOT NULL AND p.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontradas % consultas com paciente_id órfão', orphaned_count;
        
        -- Criar profiles temporários para pacientes órfãos
        INSERT INTO public.profiles (id, email, display_name, user_type, is_active)
        SELECT DISTINCT 
            c.paciente_id,
            'paciente_' || c.paciente_id || '@temp.com',
            'Paciente Temporário',
            'paciente',
            false
        FROM public.consultas c
        LEFT JOIN public.profiles p ON c.paciente_id = p.id
        WHERE c.paciente_id IS NOT NULL AND p.id IS NULL
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Criados profiles temporários para pacientes órfãos';
    ELSE
        RAISE NOTICE 'Nenhuma consulta de paciente órfã encontrada';
    END IF;
END $$;