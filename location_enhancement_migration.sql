-- =====================================================
-- LOCATION DETAILS ENHANCEMENT - DATABASE MIGRATION
-- Task 25: Database schema and migration updates
-- =====================================================

-- 1. ADD NEW COLUMNS TO locais_atendimento TABLE
-- =====================================================

ALTER TABLE public.locais_atendimento 
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS coordenadas JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS horario_funcionamento JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS facilidades JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'temporariamente_fechado', 'manutencao')),
ADD COLUMN IF NOT EXISTS motivo_fechamento TEXT,
ADD COLUMN IF NOT EXISTS previsao_reabertura TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS instrucoes_acesso TEXT,
ADD COLUMN IF NOT EXISTS observacoes_especiais TEXT,
ADD COLUMN IF NOT EXISTS ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS fonte_dados TEXT DEFAULT 'manual' CHECK (fonte_dados IN ('manual', 'api', 'scraping', 'user_report'));

-- 2. UPDATE EXISTING RECORDS
-- =====================================================

UPDATE public.locais_atendimento 
SET status = CASE 
    WHEN ativo = true THEN 'ativo'
    ELSE 'temporariamente_fechado'
END
WHERE status IS NULL;

-- 3. CREATE PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_locais_atendimento_cidade ON public.locais_atendimento(cidade);
CREATE INDEX IF NOT EXISTS idx_locais_atendimento_bairro ON public.locais_atendimento(bairro);
CREATE INDEX IF NOT EXISTS idx_locais_atendimento_status ON public.locais_atendimento(status);
CREATE INDEX IF NOT EXISTS idx_locais_atendimento_coordenadas ON public.locais_atendimento USING GIN(coordenadas);
CREATE INDEX IF NOT EXISTS idx_locais_atendimento_facilidades ON public.locais_atendimento USING GIN(facilidades);
CREATE INDEX IF NOT EXISTS idx_locais_atendimento_medico_status ON public.locais_atendimento(medico_id, status);

-- 4. ADD DATA VALIDATION CONSTRAINTS
-- =====================================================

-- Coordinates validation
ALTER TABLE public.locais_atendimento 
ADD CONSTRAINT check_coordenadas_format 
CHECK (
    coordenadas IS NULL OR (
        coordenadas ? 'lat' AND 
        coordenadas ? 'lng' AND 
        (coordenadas->>'lat')::numeric BETWEEN -90 AND 90 AND
        (coordenadas->>'lng')::numeric BETWEEN -180 AND 180
    )
);

-- Operating hours validation
ALTER TABLE public.locais_atendimento 
ADD CONSTRAINT check_horario_funcionamento_format 
CHECK (
    horario_funcionamento IS NULL OR (
        horario_funcionamento ? 'segunda' AND
        horario_funcionamento ? 'terca' AND
        horario_funcionamento ? 'quarta' AND
        horario_funcionamento ? 'quinta' AND
        horario_funcionamento ? 'sexta' AND
        horario_funcionamento ? 'sabado' AND
        horario_funcionamento ? 'domingo'
    )
);

-- Email format validation
ALTER TABLE public.locais_atendimento 
ADD CONSTRAINT check_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Phone format validation
ALTER TABLE public.locais_atendimento 
ADD CONSTRAINT check_phone_format 
CHECK (telefone IS NULL OR telefone ~ '^[\d\s\(\)\-\+]+$');

-- WhatsApp format validation
ALTER TABLE public.locais_atendimento 
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp IS NULL OR whatsapp ~ '^[\d\s\(\)\-\+]+$');

-- 5. UPDATE RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Locais de atendimento são visíveis para usuários autenticados" ON public.locais_atendimento;
DROP POLICY IF EXISTS "Médicos podem gerenciar seus locais de atendimento" ON public.locais_atendimento;

-- Create new enhanced policies
CREATE POLICY "Enhanced location data readable by authenticated users" 
ON public.locais_atendimento FOR SELECT 
TO authenticated 
USING (status = 'ativo' OR auth.uid() = medico_id);

CREATE POLICY "Doctors can manage their own locations" 
ON public.locais_atendimento FOR ALL 
TO authenticated 
USING (auth.uid() = medico_id);

CREATE POLICY "Service role can manage all locations" 
ON public.locais_atendimento FOR ALL 
TO service_role 
USING (true);

-- 6. CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to update location timestamp automatically
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate facility data format
CREATE OR REPLACE FUNCTION validate_facility_data(facilidades_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    facility JSONB;
    valid_types TEXT[] := ARRAY['estacionamento', 'acessibilidade', 'farmacia', 'laboratorio', 'wifi', 'ar_condicionado', 'elevador', 'cafe', 'banheiro_adaptado', 'sala_espera_criancas'];
    valid_costs TEXT[] := ARRAY['gratuito', 'pago', 'nao_informado'];
BEGIN
    IF jsonb_typeof(facilidades_json) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    FOR facility IN SELECT jsonb_array_elements(facilidades_json)
    LOOP
        IF NOT (facility ? 'type' AND facility ? 'available') THEN
            RETURN FALSE;
        END IF;
        
        IF NOT (facility->>'type' = ANY(valid_types)) THEN
            RETURN FALSE;
        END IF;
        
        IF jsonb_typeof(facility->'available') != 'boolean' THEN
            RETURN FALSE;
        END IF;
        
        IF facility ? 'cost' AND NOT (facility->>'cost' = ANY(valid_costs)) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get enhanced location data
CREATE OR REPLACE FUNCTION get_enhanced_location_data(location_ids UUID[] DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    nome_local TEXT,
    endereco_completo TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    coordenadas JSONB,
    horario_funcionamento JSONB,
    facilidades JSONB,
    status TEXT,
    motivo_fechamento TEXT,
    previsao_reabertura TIMESTAMP WITH TIME ZONE,
    descricao TEXT,
    instrucoes_acesso TEXT,
    observacoes_especiais TEXT,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE,
    verificado_em TIMESTAMP WITH TIME ZONE,
    fonte_dados TEXT,
    medico_id UUID,
    ativo BOOLEAN,
    is_open_now BOOLEAN,
    has_coordinates BOOLEAN,
    facility_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.id,
        la.nome_local,
        COALESCE(la.endereco_completo, la.endereco) as endereco_completo,
        la.bairro,
        la.cidade,
        la.estado,
        la.cep,
        la.telefone,
        la.whatsapp,
        la.email,
        la.website,
        la.coordenadas,
        la.horario_funcionamento,
        la.facilidades,
        la.status,
        la.motivo_fechamento,
        la.previsao_reabertura,
        la.descricao,
        la.instrucoes_acesso,
        la.observacoes_especiais,
        la.ultima_atualizacao,
        la.verificado_em,
        la.fonte_dados,
        la.medico_id,
        la.ativo,
        CASE 
            WHEN la.horario_funcionamento IS NULL THEN true
            WHEN la.status != 'ativo' THEN false
            ELSE true
        END as is_open_now,
        (la.coordenadas IS NOT NULL AND la.coordenadas ? 'lat' AND la.coordenadas ? 'lng') as has_coordinates,
        CASE 
            WHEN la.facilidades IS NULL THEN 0
            ELSE jsonb_array_length(la.facilidades)
        END as facility_count
    FROM public.locais_atendimento la
    WHERE (location_ids IS NULL OR la.id = ANY(location_ids))
    AND la.status IN ('ativo', 'temporariamente_fechado', 'manutencao')
    ORDER BY la.nome_local;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search locations with filters
CREATE OR REPLACE FUNCTION search_locations(
    search_query TEXT DEFAULT NULL,
    filter_cidade TEXT DEFAULT NULL,
    filter_bairro TEXT DEFAULT NULL,
    filter_status TEXT[] DEFAULT NULL,
    filter_facilidades TEXT[] DEFAULT NULL,
    has_parking BOOLEAN DEFAULT NULL,
    is_accessible BOOLEAN DEFAULT NULL,
    limit_results INTEGER DEFAULT 50,
    offset_results INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    nome_local TEXT,
    endereco_completo TEXT,
    cidade TEXT,
    bairro TEXT,
    telefone TEXT,
    status TEXT,
    facilidades JSONB,
    coordenadas JSONB,
    match_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.id,
        la.nome_local,
        COALESCE(la.endereco_completo, la.endereco) as endereco_completo,
        la.cidade,
        la.bairro,
        la.telefone,
        la.status,
        la.facilidades,
        la.coordenadas,
        CASE 
            WHEN search_query IS NULL THEN 1.0
            WHEN la.nome_local ILIKE '%' || search_query || '%' THEN 0.9
            WHEN COALESCE(la.endereco_completo, la.endereco) ILIKE '%' || search_query || '%' THEN 0.7
            WHEN la.bairro ILIKE '%' || search_query || '%' THEN 0.6
            WHEN la.cidade ILIKE '%' || search_query || '%' THEN 0.5
            ELSE 0.1
        END as match_score
    FROM public.locais_atendimento la
    WHERE 
        (search_query IS NULL OR (
            la.nome_local ILIKE '%' || search_query || '%' OR
            COALESCE(la.endereco_completo, la.endereco) ILIKE '%' || search_query || '%' OR
            la.bairro ILIKE '%' || search_query || '%' OR
            la.cidade ILIKE '%' || search_query || '%'
        ))
        AND (filter_cidade IS NULL OR la.cidade = filter_cidade)
        AND (filter_bairro IS NULL OR la.bairro = filter_bairro)
        AND (filter_status IS NULL OR la.status = ANY(filter_status))
        AND (has_parking IS NULL OR (
            la.facilidades IS NOT NULL AND 
            EXISTS (
                SELECT 1 FROM jsonb_array_elements(la.facilidades) as f 
                WHERE f->>'type' = 'estacionamento' AND (f->>'available')::boolean = true
            )
        ) = has_parking)
        AND (is_accessible IS NULL OR (
            la.facilidades IS NOT NULL AND 
            EXISTS (
                SELECT 1 FROM jsonb_array_elements(la.facilidades) as f 
                WHERE f->>'type' = 'acessibilidade' AND (f->>'available')::boolean = true
            )
        ) = is_accessible)
        AND (filter_facilidades IS NULL OR (
            la.facilidades IS NOT NULL AND 
            filter_facilidades <@ (
                SELECT array_agg(f->>'type') 
                FROM jsonb_array_elements(la.facilidades) as f 
                WHERE (f->>'available')::boolean = true
            )
        ))
    ORDER BY match_score DESC, la.nome_local
    LIMIT limit_results OFFSET offset_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically update timestamp on location changes
DROP TRIGGER IF EXISTS trigger_update_location_timestamp ON public.locais_atendimento;
CREATE TRIGGER trigger_update_location_timestamp
    BEFORE UPDATE ON public.locais_atendimento
    FOR EACH ROW
    EXECUTE FUNCTION update_location_timestamp();

-- Function for location status change notifications
CREATE OR REPLACE FUNCTION notify_location_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'location_status_change',
            json_build_object(
                'location_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'medico_id', NEW.medico_id,
                'timestamp', NOW()
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status change notifications
CREATE TRIGGER trigger_notify_location_status_change
    AFTER UPDATE ON public.locais_atendimento
    FOR EACH ROW
    EXECUTE FUNCTION notify_location_status_change();

-- 8. ADD FACILITY DATA VALIDATION CONSTRAINT
-- =====================================================

ALTER TABLE public.locais_atendimento 
ADD CONSTRAINT check_facilidades_format 
CHECK (facilidades IS NULL OR validate_facility_data(facilidades));

-- 9. UPDATE EXISTING FUNCTION FOR ENHANCED DATA
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_doctor_schedule_data(p_doctor_id UUID)
RETURNS TABLE(
  doctor_config JSONB,
  locations JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.configuracoes as doctor_config,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', la.id,
          'nome_local', la.nome_local,
          'endereco_completo', COALESCE(la.endereco_completo, la.endereco),
          'endereco', la.endereco,
          'bairro', la.bairro,
          'cidade', la.cidade,
          'estado', la.estado,
          'cep', la.cep,
          'telefone', la.telefone,
          'whatsapp', la.whatsapp,
          'email', la.email,
          'website', la.website,
          'coordenadas', la.coordenadas,
          'horario_funcionamento', la.horario_funcionamento,
          'facilidades', la.facilidades,
          'status', la.status,
          'ativo', la.ativo,
          'ultima_atualizacao', la.ultima_atualizacao,
          'is_open_now', CASE 
            WHEN la.status != 'ativo' THEN false
            ELSE true
          END
        )
      ) FILTER (WHERE la.id IS NOT NULL),
      '[]'::jsonb
    ) as locations
  FROM public.medicos m
  LEFT JOIN public.locais_atendimento la ON m.user_id = la.medico_id 
    AND la.status IN ('ativo', 'temporariamente_fechado')
  WHERE m.user_id = p_doctor_id
  GROUP BY m.user_id, m.configuracoes;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico não encontrado ou sem configurações: %', p_doctor_id;
  END IF;
END;
$$;

-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_enhanced_location_data(UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_locations(TEXT, TEXT, TEXT, TEXT[], TEXT[], BOOLEAN, BOOLEAN, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_facility_data(JSONB) TO authenticated, service_role;

-- 11. ADD DOCUMENTATION COMMENTS
-- =====================================================

COMMENT ON TABLE public.locais_atendimento IS 'Enhanced location data for healthcare establishments with detailed information, facilities, and status tracking';
COMMENT ON COLUMN public.locais_atendimento.coordenadas IS 'Geographic coordinates in JSON format: {"lat": number, "lng": number, "precisao": "exata|aproximada"}';
COMMENT ON COLUMN public.locais_atendimento.horario_funcionamento IS 'Weekly operating hours in JSON format with days of week as keys';
COMMENT ON COLUMN public.locais_atendimento.facilidades IS 'Array of facility objects with type, availability, and details';
COMMENT ON COLUMN public.locais_atendimento.status IS 'Current operational status of the location';
COMMENT ON COLUMN public.locais_atendimento.fonte_dados IS 'Source of the location data for quality tracking';

-- =====================================================
-- MIGRATION COMPLETED SUCCESSFULLY!
-- =====================================================