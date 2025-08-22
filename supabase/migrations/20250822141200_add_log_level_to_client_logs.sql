-- In the original migration, the CHECK constraint on the `level` column of the `client_logs`
-- table was created without a custom name, so PostgreSQL assigned a default one.
-- Typically, this default name follows the pattern `<table>_<column>_check`.
-- Based on the initial problem description, the name is `client_logs_level_check`.
--
-- This migration drops that original constraint and adds a new, explicitly named
-- constraint that includes 'log' as a valid level.

-- Step 1: Drop the existing CHECK constraint.
ALTER TABLE public.client_logs
DROP CONSTRAINT client_logs_level_check;

-- Step 2: Add a new CHECK constraint with the updated list of accepted values.
ALTER TABLE public.client_logs
ADD CONSTRAINT client_logs_level_check_v2 CHECK (level IN ('debug', 'info', 'warn', 'error', 'log'));
