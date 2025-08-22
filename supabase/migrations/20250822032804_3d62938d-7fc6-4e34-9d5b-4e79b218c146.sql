-- Create client_logs table for advanced logging system
CREATE TABLE public.client_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id UUID NOT NULL,
  session_id UUID,
  user_id UUID,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  url TEXT NOT NULL,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  context TEXT,
  meta JSONB DEFAULT '{}',
  breadcrumbs JSONB DEFAULT '[]',
  performance_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_logs ENABLE ROW LEVEL SECURITY;

-- Create allowlist table for restricted access
CREATE TABLE public.debug_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on allowlist
ALTER TABLE public.debug_allowlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_logs (only allow reading by allowlisted users)
CREATE POLICY "Allow allowlisted users to view client logs"
  ON public.client_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.debug_allowlist da
      WHERE da.user_id = auth.uid()
        AND da.is_active = true
        AND (da.expires_at IS NULL OR da.expires_at > now())
    )
  );

-- Service role can insert logs
CREATE POLICY "Service role can insert client logs"
  ON public.client_logs FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

-- RLS policies for debug_allowlist (users can only see their own entry)
CREATE POLICY "Users can view their own allowlist entry"
  ON public.debug_allowlist FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_client_logs_trace_id ON public.client_logs(trace_id);
CREATE INDEX idx_client_logs_user_id ON public.client_logs(user_id);
CREATE INDEX idx_client_logs_timestamp ON public.client_logs(timestamp DESC);
CREATE INDEX idx_client_logs_level ON public.client_logs(level);

-- Function to cleanup old logs (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_client_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.client_logs 
  WHERE created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;