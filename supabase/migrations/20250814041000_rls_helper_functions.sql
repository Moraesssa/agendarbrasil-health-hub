-- RLS Helper Functions for Security Validation
-- These functions help validate RLS policies and table security

-- Function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rls_enabled BOOLEAN;
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
    p.polcmd as cmd,
    CASE p.polpermissive WHEN TRUE THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as permissive,
    p.polroles::TEXT[] as roles,
    pg_get_expr(p.polqual, p.polrelid) as qual,
    pg_get_expr(p.polwithcheck, p.polrelid) as with_check
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = table_name
  AND n.nspname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate RLS policies for a table
CREATE OR REPLACE FUNCTION validate_table_rls(table_name TEXT)
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if RLS is enabled
  SELECT check_rls_enabled(table_name) INTO rls_enabled;
  
  IF rls_enabled THEN
    RETURN QUERY SELECT 'RLS_ENABLED'::TEXT, 'PASS'::TEXT, 'RLS is enabled on table'::TEXT;
  ELSE
    RETURN QUERY SELECT 'RLS_ENABLED'::TEXT, 'FAIL'::TEXT, 'RLS is not enabled on table'::TEXT;
  END IF;
  
  -- Check if policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = table_name
  AND n.nspname = 'public';
  
  IF policy_count > 0 THEN
    RETURN QUERY SELECT 'POLICIES_EXIST'::TEXT, 'PASS'::TEXT, 
      format('Found %s policies on table', policy_count)::TEXT;
  ELSE
    RETURN QUERY SELECT 'POLICIES_EXIST'::TEXT, 'FAIL'::TEXT, 
      'No RLS policies found on table'::TEXT;
  END IF;
  
  -- Check for basic CRUD policies
  DECLARE
    has_select BOOLEAN := FALSE;
    has_insert BOOLEAN := FALSE;
    has_update BOOLEAN := FALSE;
    has_delete BOOLEAN := FALSE;
  BEGIN
    SELECT 
      bool_or(p.polcmd = 'r') as select_policy,
      bool_or(p.polcmd = 'a') as insert_policy,
      bool_or(p.polcmd = 'w') as update_policy,
      bool_or(p.polcmd = 'd') as delete_policy
    INTO has_select, has_insert, has_update, has_delete
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = table_name
    AND n.nspname = 'public';
    
    IF has_select THEN
      RETURN QUERY SELECT 'SELECT_POLICY'::TEXT, 'PASS'::TEXT, 'SELECT policy exists'::TEXT;
    ELSE
      RETURN QUERY SELECT 'SELECT_POLICY'::TEXT, 'WARN'::TEXT, 'No SELECT policy found'::TEXT;
    END IF;
    
    IF has_insert THEN
      RETURN QUERY SELECT 'INSERT_POLICY'::TEXT, 'PASS'::TEXT, 'INSERT policy exists'::TEXT;
    ELSE
      RETURN QUERY SELECT 'INSERT_POLICY'::TEXT, 'WARN'::TEXT, 'No INSERT policy found'::TEXT;
    END IF;
    
    IF has_update THEN
      RETURN QUERY SELECT 'UPDATE_POLICY'::TEXT, 'PASS'::TEXT, 'UPDATE policy exists'::TEXT;
    ELSE
      RETURN QUERY SELECT 'UPDATE_POLICY'::TEXT, 'WARN'::TEXT, 'No UPDATE policy found'::TEXT;
    END IF;
    
    IF has_delete THEN
      RETURN QUERY SELECT 'DELETE_POLICY'::TEXT, 'PASS'::TEXT, 'DELETE policy exists'::TEXT;
    ELSE
      RETURN QUERY SELECT 'DELETE_POLICY'::TEXT, 'WARN'::TEXT, 'No DELETE policy found'::TEXT;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_policies(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_table_rls(TEXT) TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_table_policies(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION validate_table_rls(TEXT) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION check_rls_enabled(TEXT) 
IS 'Verifica se RLS está habilitado em uma tabela específica';

COMMENT ON FUNCTION get_table_policies(TEXT) 
IS 'Retorna todas as políticas RLS de uma tabela específica';

COMMENT ON FUNCTION validate_table_rls(TEXT) 
IS 'Executa validação completa de RLS em uma tabela';