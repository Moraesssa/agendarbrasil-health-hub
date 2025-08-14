-- Fix SQL syntax error in payment audit trigger
-- Addresses: ERROR 42P01: missing FROM-clause entry for table "old"

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS payment_audit_trigger ON public.pagamentos;
DROP FUNCTION IF EXISTS audit_payment_changes();

-- Create corrected audit function with proper syntax
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all payment modifications for security audit
  INSERT INTO public.audit_log (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    timestamp
  ) VALUES (
    'pagamentos',
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb
      ELSE NULL 
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN row_to_json(NEW)::jsonb
      WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)::jsonb
      ELSE NULL 
    END,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    NOW()
  );
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the audit trigger with correct syntax
CREATE TRIGGER payment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION audit_payment_changes();

-- Ensure audit_log table exists with proper structure
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log if not already enabled
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Drop and recreate audit log policy to ensure it's correct
DROP POLICY IF EXISTS "audit_log_service_role_only" ON public.audit_log;
CREATE POLICY "audit_log_service_role_only" 
ON public.audit_log 
FOR ALL 
USING (
  current_setting('role') = 'service_role' OR
  current_user = 'service_role'
);

-- Add index for better performance on audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_timestamp 
ON public.audit_log (table_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_timestamp 
ON public.audit_log (user_id, timestamp DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION audit_payment_changes() 
IS 'Função de auditoria para registrar todas as modificações na tabela pagamentos';

COMMENT ON TABLE public.audit_log 
IS 'Tabela de auditoria para rastrear modificações em dados sensíveis';