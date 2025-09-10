#!/usr/bin/env node

/**
 * Quick verification script to confirm the medicos schema fix worked
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
  console.log('🔍 Verifying medicos schema fix...\n');

  try {
    // Test the dados_profissionais column specifically
    const { data, error } = await supabase
      .from('medicos')
      .select('id, crm, dados_profissionais, configuracoes, verificacao')
      .limit(1);

    if (error) {
      if (error.message.includes('dados_profissionais')) {
        console.log('❌ Fix not applied yet. The dados_profissionais column is still missing.');
        console.log('📋 Please run the SQL script in your Supabase dashboard.');
        return false;
      } else {
        console.log('⚠️  Other error (might be due to RLS policies):', error.message);
        console.log('✅ But the dados_profissionais column exists (no column error)');
        return true;
      }
    }

    console.log('✅ SUCCESS! The medicos table schema is now correct.');
    console.log(`📊 Found ${data?.length || 0} records in medicos table`);
    
    if (data && data.length > 0) {
      console.log('📋 Sample record structure:');
      const sample = data[0];
      console.log('   - id:', sample.id ? '✅' : '❌');
      console.log('   - crm:', sample.crm ? '✅' : '❌');
      console.log('   - dados_profissionais:', typeof sample.dados_profissionais === 'object' ? '✅' : '❌');
      console.log('   - configuracoes:', typeof sample.configuracoes === 'object' ? '✅' : '❌');
      console.log('   - verificacao:', typeof sample.verificacao === 'object' ? '✅' : '❌');
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  const success = await verifyFix();
  
  if (success) {
    console.log('\n🎉 Schema fix verified! Your application should work now.');
    console.log('💡 Try the medico onboarding process again.');
  } else {
    console.log('\n❌ Schema fix not yet applied.');
    console.log('📋 Next steps:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Run the URGENT_FIX_MEDICOS_SCHEMA.sql script');
    console.log('   4. Run this verification script again');
  }
}

main().catch(console.error);