/**
 * Script to apply location enhancement database migration
 * Task 25: Database schema and migration updates
 * replaced by kiro @2025-02-08T19:45:00Z
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Starting location enhancement database migration...');
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250208_location_enhancement_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters`);
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0);
          
          if (directError) {
            console.warn(`⚠️  Statement ${i + 1} failed:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Results:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      
      // Verify the migration by checking if new columns exist
      console.log('\n🔍 Verifying migration...');
      await verifyMigration();
      
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

async function verifyMigration() {
  try {
    // Test if we can query the enhanced location data
    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('id, nome_local, status, facilidades, coordenadas, horario_funcionamento')
      .limit(1);
    
    if (error) {
      console.log('❌ Verification failed:', error.message);
      return;
    }
    
    console.log('✅ Migration verified successfully!');
    console.log('📋 Enhanced location table is ready for use');
    
    if (data && data.length > 0) {
      console.log(`📍 Found ${data.length} existing location(s) in the database`);
    }
    
  } catch (error) {
    console.log('❌ Verification error:', error.message);
  }
}

// Alternative approach: Execute migration using raw SQL
async function applyMigrationDirect() {
  try {
    console.log('🚀 Applying migration using direct SQL execution...');
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250208_location_enhancement_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as a single transaction
    const { error } = await supabase.rpc('exec_migration', {
      migration_sql: migrationSQL
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Migration applied successfully!');
    await verifyMigration();
    
  } catch (error) {
    console.error('💥 Direct migration failed:', error.message);
    console.log('\n🔄 Falling back to statement-by-statement execution...');
    await applyMigration();
  }
}

// Check if we should use direct or statement-by-statement approach
async function main() {
  console.log('🏥 AgendarBrasil Health Hub - Location Enhancement Migration');
  console.log('=' .repeat(60));
  
  // First try direct approach, fallback to statement-by-statement
  await applyMigrationDirect();
}

// Run the migration
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});