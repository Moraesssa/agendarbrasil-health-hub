-- Add helper functions for RLS validation and security checks

-- Function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rls_enabled BOOLEAN := FALSE;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = table_name 
  AND n.nspname = 'public'
  AND c.relkind = 'r';
  
  RETURN COALESCE(rls_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table policies
CREATE OR REPLACE FUNCTION get_table_policies(table_name TEXT)
RETURNS TABLE(
  policyname NAME,
  cmd TEXT,
  permissive TEXT,
  roles TEXT[],
  qual TEXT,
  with_check TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.polname as policyname,
    p.polcmd::TEXT as cmd,
    CASE p.polpermissive WHEN TRUE THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as permissive,
    ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(p.polroles)) as roles,
    pg_get_expr(p.polqual, p.polrelid) as qual,
    pg_get_expr(p.polwithcheck, p.polrelid) as with_check
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = table_name
  AND n.nspname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate payment table security
CREATE OR REPLACE FUNCTION validate_payment_table_security()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  audit_trigger_exists BOOLEAN;
BEGIN
  -- Check 1: RLS enabled
  SELECT check_rls_enabled('pagamentos') INTO rls_enabled;
  RETURN QUERY SELECT 
    'RLS_ENABLED'::TEXT,
    CASE WHEN rls_enabled THEN 'PASS' ELSE 'FAIL' END::TEXT,
    CASE WHEN rls_enabled THEN 'RLS está habilitado' ELSE 'RLS não está habilitado - CRÍTICO!' END::TEXT;

  -- Check 2: Policy count
  SELECT COUNT(*) INTO policy_count
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = 'pagamentos' AND n.nspname = 'public';
  
  RETURN QUERY SELECT 
    'POLICY_COUNT'::TEXT,
    CASE WHEN policy_count >= 5 THEN 'PASS' ELSE 'WARN' END::TEXT,
    format('Encontradas %s políticas RLS', policy_count)::TEXT;

  -- Check 3: Audit trigger exists
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'pagamentos' 
    AND n.nspname = 'public'
    AND t.tgname = 'payment_audit_trigger'
  ) INTO audit_trigger_exists;
  
  RETURN QUERY SELECT 
    'AUDIT_TRIGGER'::TEXT,
    CASE WHEN audit_trigger_exists THEN 'PASS' ELSE 'WARN' END::TEXT,
    CASE WHEN audit_trigger_exists THEN 'Trigger de auditoria ativo' ELSE 'Trigger de auditoria não encontrado' END::TEXT;

  -- Check 4: Sensitive columns exist
  RETURN QUERY SELECT 
    'SENSITIVE_COLUMNS'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'pagamentos' 
      AND table_schema = 'public'
      AND column_name IN ('gateway_id', 'dados_gateway', 'valor')
    ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Colunas sensíveis identificadas'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_table_policies(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_payment_table_security() TO authenticated, service_role;

-- Add comments
COMMENT ON FUNCTION check_rls_enabled(TEXT) 
IS 'Verifica se RLS está habilitado em uma tabela específica';

COMMENT ON FUNCTION get_table_policies(TEXT) 
IS 'Retorna todas as políticas RLS de uma tabela';

COMMENT ON FUNCTION validate_payment_table_security() 
IS 'Executa validação completa de segurança da tabela pagamentos';