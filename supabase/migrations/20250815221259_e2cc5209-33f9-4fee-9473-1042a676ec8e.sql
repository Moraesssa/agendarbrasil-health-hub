-- Secure external_data_sources: prevent API key exposure to clients while preserving service access

-- 1) Ensure RLS is enabled
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;

-- 2) Lock down direct table access for client roles (so API keys are never exposed)
REVOKE ALL ON TABLE public.external_data_sources FROM anon, authenticated;

-- 3) Remove old doctor-only select policy (no longer needed)
DROP POLICY IF EXISTS external_data_sources_verified_doctors ON public.external_data_sources;

-- 4) Allow service_role access via explicit policy (for webhooks/servers)
DROP POLICY IF EXISTS external_data_sources_service_role ON public.external_data_sources;
CREATE POLICY external_data_sources_service_role
ON public.external_data_sources
FOR ALL
USING (current_setting('role', true) = 'service_role');

-- 5) Create a SECURITY DEFINER RPC that exposes only non-sensitive fields (no api_key)
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

-- 6) Grant execute on RPC to authenticated users
GRANT EXECUTE ON FUNCTION public.get_external_data_sources_public() TO authenticated;

-- 7) Document
COMMENT ON FUNCTION public.get_external_data_sources_public() IS 'Returns only non-sensitive fields from external_data_sources for authenticated users. API keys are never exposed.';
COMMENT ON POLICY external_data_sources_service_role ON public.external_data_sources IS 'Service role can manage/access data sources for server-side operations and webhooks.';