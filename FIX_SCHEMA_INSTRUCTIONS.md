# 🚨 URGENT: Fix Medicos Schema Issue

## Problem
Your application is getting this error:
```
Could not find the 'dados_profissionais' column of 'medicos' in the schema cache
```

This means the `dados_profissionais` column is missing from your `medicos` table in Supabase.

## Solution Steps

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `ulebotjrsgheybhpdnxd`
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Fix Script
1. Copy the entire content of `URGENT_FIX_MEDICOS_SCHEMA.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### Step 3: Verify the Fix
The script will:
- ✅ Check current table structure
- ✅ Add missing `dados_profissionais` column
- ✅ Add other missing columns if needed
- ✅ Show final table structure

### Step 4: Test Your Application
After running the SQL script:
1. Refresh your application
2. Try the medico onboarding process again
3. The error should be resolved

## Alternative: Manual Column Addition
If you prefer to add just the missing column manually:

```sql
ALTER TABLE public.medicos 
ADD COLUMN dados_profissionais JSONB NOT NULL DEFAULT '{}'::jsonb;
```

## Expected Table Structure
After the fix, your `medicos` table should have these columns:
- `id` (UUID)
- `user_id` (UUID)
- `crm` (TEXT)
- `especialidades` (TEXT[])
- `registro_especialista` (TEXT)
- `telefone` (TEXT)
- `whatsapp` (TEXT)
- `endereco` (JSONB)
- `dados_profissionais` (JSONB) ← This was missing!
- `configuracoes` (JSONB)
- `verificacao` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Why This Happened
This issue typically occurs when:
1. Database migrations weren't applied properly
2. The table was created with an older schema
3. Manual changes were made that didn't include all columns

## Need Help?
If you're still getting errors after running the fix:
1. Check the SQL Editor output for any error messages
2. Verify the column was added by running:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'medicos' AND column_name = 'dados_profissionais';
   ```
3. Clear your browser cache and try again