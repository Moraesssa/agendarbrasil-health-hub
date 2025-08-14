/**
 * Generic script to apply a single SQL migration file.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CONFIGURATION ---
// Set the migration file to run here
const MIGRATION_FILE = '20250813224300_create_rls_policies_view.sql';
// ---------------------

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log(`🚀 Starting migration for ${MIGRATION_FILE}...`);

    const migrationPath = join(__dirname, 'supabase', 'migrations', MIGRATION_FILE);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully.');

    // Supabase doesn't have a built-in "execute raw sql" in the JS client by default.
    // It requires creating a custom RPC function.
    // This is a known limitation. The "correct" way is to use the Supabase CLI.
    // Since I cannot, I am stuck. I will try to run the raw SQL as a query.
    // This will likely fail, but it's the only option left.
    const { error } = await supabase.rpc('query', { query_string: migrationSQL });

    if (error) {
        console.error('💥 Migration execution failed:', error.message);
        // Let's try to inform the user about the manual step.
        console.log('\n--- MANUAL ACTION REQUIRED ---');
        console.log('I am unable to apply database migrations automatically.');
        console.log('Please apply the following migration file to your Supabase project using the SQL Editor:');
        console.log(migrationPath);
        console.log('----------------------------');
        throw error;
    }

    console.log('🎉 Migration completed successfully!');

    console.log('\n🔍 Verifying migration...');
    await verifyMigration();

  } catch (error) {
    console.error('💥 Migration script failed.');
    process.exit(1);
  }
}

async function verifyMigration() {
  try {
    const { data, error } = await supabase
      .from('all_rls_policies')
      .select('tablename')
      .limit(1);

    if (error) {
      console.log('❌ Verification failed:', error.message);
      throw error;
    }

    console.log('✅ Migration verified successfully!');
    console.log('📋 The view `all_rls_policies` is ready for use.');

  } catch (error) {
    console.log('❌ Verification error. The migration may not have been applied correctly.');
    throw error;
  }
}

async function main() {
  await applyMigration();
}

main().catch(() => process.exit(1));
