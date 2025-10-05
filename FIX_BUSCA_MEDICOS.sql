-- ================================================================
-- CORREÇÃO DA BUSCA DE MÉDICOS POR ESPECIALIDADE E LOCALIZAÇÃO
-- ================================================================
-- Corrige a função get_doctors_by_location_and_specialty
-- ================================================================

BEGIN;

-- ================================================================
-- ETAPA 1: DIAGNÓSTICO - Verificar dados do médico davirh1221
-- ================================================================

SELECT '1. DIAGNOSTICANDO DADOS DO MÉDICO' as etapa;

-- Verificar se o médico existe
DO $$
DECLARE
  v_medico_record RECORD;
  v_locais_count INTEGER;
BEGIN
  RAISE NOTICE '=== DIAGNÓSTICO DO MÉDICO davirh1221 ===';
  
  -- Buscar médico por username/email
  SELECT m.*, p.display_name, p.email
  INTO v_medico_record
  FROM medicos m
  LEFT JOIN profiles p ON p.id = m.user_id
  WHERE p.email ILIKE '%davirh1221%' 
     OR p.display_name ILIKE '%davirh1221%'
     OR m.crm ILIKE '%davirh1221%'
  LIMIT 1;
  
  IF v_medico_record IS NULL THEN
    RAISE NOTICE '❌ Médico não encontrado com identificador "davirh1221"';
    RAISE NOTICE '   Listando todos os médicos cadastrados:';
    
    FOR v_medico_record IN 
      SELECT m.id, m.user_id, m.crm, p.display_name, p.email, m.especialidades
      FROM medicos m
      LEFT JOIN profiles p ON p.id = m.user_id
      LIMIT 10
    LOOP
      RAISE NOTICE '   - ID: %, User: %, Nome: %, Email: %, Especialidades: %', 
        v_medico_record.id, v_medico_record.user_id, 
        v_medico_record.display_name, v_medico_record.email,
        v_medico_record.especialidades;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ Médico encontrado:';
    RAISE NOTICE '   ID: %', v_medico_record.id;
    RAISE NOTICE '   User ID: %', v_medico_record.user_id;
    RAISE NOTICE '   Nome: %', v_medico_record.display_name;
    RAISE NOTICE '   Email: %', v_medico_record.email;
    RAISE NOTICE '   CRM: %', v_medico_record.crm;
    RAISE NOTICE '   Especialidades: %', v_medico_record.especialidades;
    
    -- Verificar locais de atendimento
    SELECT COUNT(*) INTO v_locais_count
    FROM locais_atendimento la
    WHERE la.medico_id::text IN (v_medico_record.id::text, v_medico_record.user_id::text)
    AND la.ativo = true;
    
    RAISE NOTICE '   Locais ativos: %', v_locais_count;
    
    IF v_locais_count > 0 THEN
      RAISE NOTICE '   Detalhes dos locais:';
      -- Usar query dinâmica para lidar com nomes de colunas variáveis
      BEGIN
        FOR v_medico_record IN
          SELECT 
            COALESCE(la.nome, la.name, 'Local') as nome_local,
            COALESCE(la.cidade, la.city, '') as cidade_local,
            COALESCE(la.estado, la.state, '') as estado_local,
            la.ativo
          FROM locais_atendimento la
          WHERE la.medico_id::text IN (
            (SELECT id::text FROM medicos WHERE user_id = v_medico_record.user_id),
            v_medico_record.user_id::text
          )
        LOOP
          RAISE NOTICE '     - %: %, % (Ativo: %)', 
            v_medico_record.nome_local, v_medico_record.cidade_local, 
            v_medico_record.estado_local, v_medico_record.ativo;
        END LOOP;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE '     ⚠️ Erro ao listar locais: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE '   ⚠️ Nenhum local de atendimento cadastrado!';
    END IF;
  END IF;
END $$;

-- ================================================================
-- ETAPA 2: RECRIAR FUNÇÃO get_doctors_by_location_and_specialty
-- ================================================================

SELECT '2. RECRIANDO FUNÇÃO get_doctors_by_location_and_specialty' as etapa;

DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
  p_specialty TEXT,
  p_city TEXT,
  p_state TEXT
)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  especialidades TEXT[],
  crm TEXT,
  telefone TEXT,
  local_nome TEXT,
  local_endereco JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_nome_column BOOLEAN;
  v_has_cidade_column BOOLEAN;
  v_has_estado_column BOOLEAN;
BEGIN
  -- Detectar quais colunas existem
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'locais_atendimento' 
    AND column_name = 'nome'
  ) INTO v_has_nome_column;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'locais_atendimento' 
    AND column_name = 'cidade'
  ) INTO v_has_cidade_column;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'locais_atendimento' 
    AND column_name = 'estado'
  ) INTO v_has_estado_column;
  
  -- Construir query dinamicamente baseado nas colunas disponíveis
  RETURN QUERY EXECUTE format('
    SELECT DISTINCT
      m.id as id,
      COALESCE(p.display_name, p.email, ''Dr. '' || m.crm) as display_name,
      m.especialidades,
      m.crm,
      m.telefone,
      %s as local_nome,
      jsonb_build_object(
        ''logradouro'', COALESCE(la.endereco, la.address, ''''),
        ''numero'', COALESCE(la.numero, la.number, ''''),
        ''cidade'', %s,
        ''estado'', %s,
        ''cep'', COALESCE(la.cep, la.zip_code, '''')
      ) as local_endereco
    FROM medicos m
    LEFT JOIN profiles p ON p.id = m.user_id
    INNER JOIN locais_atendimento la ON (
      la.medico_id::text = m.id::text OR 
      la.medico_id::text = m.user_id::text
    )
    WHERE la.ativo = true
      AND (
        $1 IS NULL OR 
        $1 = '''' OR
        $1 = ANY(m.especialidades) OR
        EXISTS (
          SELECT 1 FROM unnest(m.especialidades) AS esp
          WHERE esp ILIKE ''%%'' || $1 || ''%%''
        )
      )
      AND (
        $2 IS NULL OR 
        $2 = '''' OR
        LOWER(%s) = LOWER($2) OR
        %s ILIKE ''%%'' || $2 || ''%%''
      )
      AND (
        $3 IS NULL OR 
        $3 = '''' OR
        UPPER(%s) = UPPER($3)
      )
    ORDER BY display_name
  ',
    CASE WHEN v_has_nome_column THEN 'COALESCE(la.nome, la.name, ''Local'')' ELSE 'COALESCE(la.name, ''Local'')' END,
    CASE WHEN v_has_cidade_column THEN 'COALESCE(la.cidade, la.city, '''')' ELSE 'COALESCE(la.city, '''')' END,
    CASE WHEN v_has_estado_column THEN 'COALESCE(la.estado, la.state, '''')' ELSE 'COALESCE(la.state, '''')' END,
    CASE WHEN v_has_cidade_column THEN 'la.cidade' ELSE 'la.city' END,
    CASE WHEN v_has_cidade_column THEN 'la.cidade' ELSE 'la.city' END,
    CASE WHEN v_has_estado_column THEN 'la.estado' ELSE 'la.state' END
  ) USING p_specialty, p_city, p_state;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao buscar médicos: %', SQLERRM;
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT)
IS 'Busca médicos por especialidade, cidade e estado. Versão robusta com tratamento de tipos e busca flexível.';

-- ================================================================
-- ETAPA 3: TESTAR A FUNÇÃO
-- ================================================================

SELECT '3. TESTANDO A FUNÇÃO' as etapa;

-- Teste 1: Buscar todos os médicos (sem filtros)
SELECT 
  '📋 Teste 1: Todos os médicos' as teste,
  COUNT(*) as total
FROM get_doctors_by_location_and_specialty(NULL, NULL, NULL);

-- Teste 2: Buscar por estado específico
DO $$
DECLARE
  v_count INTEGER;
  v_estados TEXT[];
BEGIN
  -- Listar estados disponíveis
  SELECT array_agg(DISTINCT estado) INTO v_estados
  FROM locais_atendimento
  WHERE ativo = true;
  
  RAISE NOTICE '📍 Estados disponíveis: %', v_estados;
  
  -- Testar busca por cada estado
  FOR i IN 1..array_length(v_estados, 1) LOOP
    SELECT COUNT(*) INTO v_count
    FROM get_doctors_by_location_and_specialty(NULL, NULL, v_estados[i]);
    
    RAISE NOTICE '   Estado %: % médicos', v_estados[i], v_count;
  END LOOP;
END $$;

-- Teste 3: Buscar por especialidade
DO $$
DECLARE
  v_count INTEGER;
  v_especialidades TEXT[];
BEGIN
  -- Listar especialidades disponíveis
  SELECT array_agg(DISTINCT unnest) INTO v_especialidades
  FROM medicos, unnest(especialidades)
  LIMIT 10;
  
  RAISE NOTICE '🏥 Especialidades disponíveis: %', v_especialidades;
  
  -- Testar busca por cada especialidade
  FOR i IN 1..LEAST(array_length(v_especialidades, 1), 5) LOOP
    SELECT COUNT(*) INTO v_count
    FROM get_doctors_by_location_and_specialty(v_especialidades[i], NULL, NULL);
    
    RAISE NOTICE '   %: % médicos', v_especialidades[i], v_count;
  END LOOP;
END $$;

-- Teste 4: Buscar médico específico (davirh1221)
DO $$
DECLARE
  v_medico RECORD;
  v_count INTEGER;
BEGIN
  -- Buscar dados do médico
  SELECT m.especialidades, la.cidade, la.estado
  INTO v_medico
  FROM medicos m
  LEFT JOIN profiles p ON p.id = m.user_id
  LEFT JOIN locais_atendimento la ON (
    la.medico_id::text = m.id::text OR 
    la.medico_id::text = m.user_id::text
  )
  WHERE (
    p.email ILIKE '%davirh1221%' OR 
    p.display_name ILIKE '%davirh1221%' OR
    m.crm ILIKE '%davirh1221%'
  )
  AND la.ativo = true
  LIMIT 1;
  
  IF v_medico IS NOT NULL THEN
    RAISE NOTICE '🔍 Testando busca do médico davirh1221:';
    RAISE NOTICE '   Especialidades: %', v_medico.especialidades;
    RAISE NOTICE '   Cidade: %', v_medico.cidade;
    RAISE NOTICE '   Estado: %', v_medico.estado;
    
    -- Testar busca com os dados do médico
    IF array_length(v_medico.especialidades, 1) > 0 THEN
      SELECT COUNT(*) INTO v_count
      FROM get_doctors_by_location_and_specialty(
        v_medico.especialidades[1],
        v_medico.cidade,
        v_medico.estado
      );
      
      RAISE NOTICE '   Resultado da busca: % médicos encontrados', v_count;
      
      IF v_count > 0 THEN
        RAISE NOTICE '   ✅ Médico aparece nos resultados!';
      ELSE
        RAISE NOTICE '   ❌ Médico NÃO aparece nos resultados!';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Médico davirh1221 não encontrado ou sem local ativo';
  END IF;
END $$;

COMMIT;

-- ================================================================
-- ETAPA 4: INSTRUÇÕES FINAIS
-- ================================================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║         CORREÇÃO DA BUSCA DE MÉDICOS CONCLUÍDA!              ║
╚════════════════════════════════════════════════════════════════╝

✅ Função get_doctors_by_location_and_specialty recriada
✅ Tratamento robusto de tipos (UUID vs BIGINT)
✅ Busca flexível (case-insensitive, partial match)
✅ Testes executados

📋 PRÓXIMOS PASSOS:

1. VERIFICAR OS LOGS ACIMA:
   - O médico davirh1221 foi encontrado?
   - Ele tem locais de atendimento ativos?
   - Ele aparece nos resultados da busca?

2. SE O MÉDICO NÃO FOI ENCONTRADO:
   - Verifique se o cadastro está completo
   - Confirme que há locais de atendimento ativos
   - Verifique se as especialidades estão cadastradas

3. TESTAR NO FRONTEND:
   - Acesse /agendamento
   - Selecione a especialidade do médico
   - Selecione o estado e cidade
   - O médico deve aparecer na lista!

4. SE AINDA NÃO APARECER:
   Execute esta query para debug:
   
   SELECT * FROM get_doctors_by_location_and_specialty(
     ''[ESPECIALIDADE]'',
     ''[CIDADE]'',
     ''[ESTADO]''
   );

═══════════════════════════════════════════════════════════════

' as instrucoes;
