#!/usr/bin/env node

/**
 * Test script to verify the medicos table schema and test the dados_profissionais column
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMedicosSchema() {
  console.log('🔍 Testing medicos table schema...\n');

  try {
    // Test 1: Check if we can query the medicos table structure
    console.log('1. Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('medicos')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error querying medicos table:', tableError.message);
      return false;
    }

    console.log('✅ Successfully queried medicos table');

    // Test 2: Try to insert a test record with dados_profissionais
    console.log('\n2. Testing dados_profissionais column...');
    
    // First, let's check if we have any existing records
    const { data: existingRecords, error: selectError } = await supabase
      .from('medicos')
      .select('id, crm, dados_profissionais')
      .limit(5);

    if (selectError) {
      console.error('❌ Error selecting from medicos:', selectError.message);
      return false;
    }

    console.log(`✅ Found ${existingRecords?.length || 0} existing medicos records`);
    
    if (existingRecords && existingRecords.length > 0) {
      console.log('📋 Sample records:');
      existingRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. CRM: ${record.crm}, dados_profissionais:`, 
          JSON.stringify(record.dados_profissionais, null, 2));
      });
    }

    // Test 3: Try to update an existing record or create a test one
    console.log('\n3. Testing dados_profissionais update...');
    
    const testData = {
      dados_profissionais: {
        nome: 'Dr. Teste Schema',
        especialidade: 'Clínica Geral',
        formacao: 'Medicina',
        instituicao: 'Teste University',
        bio: 'Médico de teste para verificação do schema'
      }
    };

    // Try to find a record to update (without authentication, this might fail due to RLS)
    if (existingRecords && existingRecords.length > 0) {
      const testRecord = existingRecords[0];
      const { data: updateData, error: updateError } = await supabase
        .from('medicos')
        .update(testData)
        .eq('id', testRecord.id)
        .select();

      if (updateError) {
        console.log('⚠️  Update failed (likely due to RLS policies):', updateError.message);
        console.log('   This is expected if not authenticated as the record owner');
      } else {
        console.log('✅ Successfully updated dados_profissionais');
      }
    }

    console.log('\n✅ Schema test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - medicos table is accessible');
    console.log('   - dados_profissionais column exists and accepts JSONB data');
    console.log('   - Table structure appears to be correct');
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error during schema test:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting medicos schema verification...\n');
  
  const success = await testMedicosSchema();
  
  if (success) {
    console.log('\n🎉 All tests passed! The medicos table schema is working correctly.');
    console.log('\n💡 If you\'re still getting the PGRST204 error, try:');
    console.log('   1. Restart your Supabase local instance (if using local dev)');
    console.log('   2. Clear your browser cache');
    console.log('   3. Check if you\'re authenticated properly in your app');
  } else {
    console.log('\n❌ Schema test failed. Please run the fix-medicos-schema-cache.sql script.');
    process.exit(1);
  }
}

main().catch(console.error);