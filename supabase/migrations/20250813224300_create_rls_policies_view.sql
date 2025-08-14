-- Create a view in the public schema to easily query RLS policies
-- from the pg_catalog, bypassing the schema limitation of the Supabase client.
DROP VIEW IF EXISTS public.all_rls_policies;

CREATE VIEW public.all_rls_policies AS
SELECT
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
FROM pg_catalog.pg_policies p
WHERE p.schemaname = 'public';

-- Grant usage to authenticated users to be safe, though service_role should have access.
GRANT SELECT ON public.all_rls_policies TO authenticated;
GRANT SELECT ON public.all_rls_policies TO service_role;
