-- Secure external_data_sources: prevent API key exposure to clients while preserving service access

-- 1) Ensure RLS is enabled and lock down direct table access for client roles
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;

-- Revoke direct privileges from anon/authenticated so clients cannot select the table
REVOKE ALL ON TABLE public.external_data_sources FROM anon, authenticated;

-- 2) Remove existing permissive/role-targeted select policies (doctors) to centralize access
DROP POLICY IF EXISTS external_data_sources_verified_doctors ON public.external_data_sources;

-- 3) Allow service_role full access via RLS (for Edge Functions, webhooks, internal jobs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'external_data_sources' AND polname = 'external_data_sources_service_role'
  ) THEN
    EXECUTE $$
      CREATE POLICY external_data_sources_service_role
      ON public.external_data_sources
      FOR ALL
      USING (current_setting('role', true) = 'service_role')
    $$;
  END IF;
END$$;

-- 4) Create a SECURITY DEFINER RPC that exposes only safe columns (no api_key)
CREATE OR REPLACE FUNCTION public.get_external_data_sources_public()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  data_types text[],
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id, name, description, data_types, is_active, created_at
  FROM public.external_data_sources
  WHERE is_active = true
  ORDER BY name;
$$;

-- 5) Grant execute on RPC to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_external_data_sources_public() TO authenticated;

-- 6) Documentation comments for clarity
COMMENT ON FUNCTION public.get_external_data_sources_public() IS 'Returns only non-sensitive fields from external_data_sources for authenticated users. API keys are never exposed.';
COMMENT ON POLICY external_data_sources_service_role ON public.external_data_sources IS 'Service role can manage/access data sources for server-side operations and webhooks.';