-- Create a function to query RLS policies from the pg_catalog schema, as it's not directly accessible by default.
CREATE OR REPLACE FUNCTION get_all_rls_policies()
RETURNS TABLE(
    schemaname text,
    tablename text,
    policyname text,
    cmd text,
    qual text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.schemaname::text,
        p.tablename::text,
        p.policyname::text,
        p.cmd::text,
        p.qual
    FROM pg_catalog.pg_policies p
    WHERE p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql;
