# Apply User Preferences Table Migration

This guide explains how to apply the user_preferences table migration to your Supabase database.

## Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `create_user_preferences_table.sql`
5. Click **Run** or press `Ctrl+Enter`
6. Verify the table was created in the **Table Editor**

## Option 2: Supabase CLI

If you're using Supabase locally or want to create a migration:

```bash
# Create a new migration
npx supabase migration new create_user_preferences_table

# Copy the SQL content to the generated migration file
# Then apply it
npx supabase db push
```

## Option 3: Direct SQL Execution

```bash
# Using psql (if you have direct database access)
psql -h your-db-host -U postgres -d postgres -f database/create_user_preferences_table.sql
```

## Verification

After applying the migration, verify it worked:

### Check Table Exists

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences';
```

### Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_preferences';
```

Should return `rowsecurity = true`

### Check Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_preferences';
```

Should return 4 policies (SELECT, INSERT, UPDATE, DELETE)

### Test Insert (as authenticated user)

```sql
-- This should work when executed as an authenticated user
INSERT INTO user_preferences (user_id, preference_type, preferences)
VALUES (auth.uid(), 'dashboard', '{"defaultPeriod": "month"}'::jsonb);
```

## Rollback (if needed)

If you need to remove the table:

```sql
-- Drop the table and all related objects
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP FUNCTION IF EXISTS update_user_preferences_updated_at() CASCADE;
```

## What This Migration Creates

- ✅ `user_preferences` table with JSONB preferences column
- ✅ Unique constraint on (user_id, preference_type)
- ✅ Indexes for performance
- ✅ RLS policies (users can only access their own data)
- ✅ Auto-update trigger for `updated_at` timestamp
- ✅ Table and column comments for documentation

## Next Steps

After applying the migration:

1. The DashboardContext will automatically start using the table
2. User preferences will be saved when users customize their dashboard
3. Preferences will persist across sessions
4. No additional configuration needed

## Troubleshooting

### Error: "relation already exists"
The table already exists. You can either:
- Skip this migration
- Drop the existing table first (see Rollback section)

### Error: "permission denied"
Make sure you're connected as a user with CREATE TABLE permissions (usually the postgres user or project owner).

### RLS Policies Not Working
Verify that:
1. RLS is enabled: `ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;`
2. Policies exist: Check with the verification query above
3. User is authenticated: `SELECT auth.uid();` should return a UUID

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you're using the correct database (not a local/staging one by mistake)
