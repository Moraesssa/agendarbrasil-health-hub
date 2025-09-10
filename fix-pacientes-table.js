#!/usr/bin/env node

/**
 * Script to fix the pacientes table structure
 * Adds the missing 'contato' column that's causing the onboarding error
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPacientesTable() {
  console.log('🔧 Fixing pacientes table structure...');
  
  try {
    // Check current table structure
    console.log('📋 Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'pacientes' })
      .single();
    
    if (columnsError) {
      console.log('ℹ️  Using alternative method to check table structure...');
      
      // Try to query the table to see what columns exist
      const { data: testData, error: testError } = await supabase
        .from('pacientes')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error checking table structure:', testError.message);
        return false;
      }
      
      console.log('✅ Table exists and is accessible');
    }
    
    // Add the missing contato column
    console.log('➕ Adding contato column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.pacientes 
        ADD COLUMN IF NOT EXISTS contato jsonb DEFAULT '{}';
        
        COMMENT ON COLUMN public.pacientes.contato IS 'Contact information including phone, whatsapp, emergency contacts, etc.';
      `
    });
    
    if (alterError) {
      console.error('❌ Error adding column:', alterError.message);
      return false;
    }
    
    console.log('✅ Successfully added contato column to pacientes table');
    
    // Test the fix by attempting a sample insert
    console.log('🧪 Testing the fix...');
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID for testing
    
    const { error: insertError } = await supabase
      .from('pacientes')
      .insert({
        user_id: testUserId,
        dados_pessoais: { nomeCompleto: 'Test User' },
        contato: { telefone: '11999999999' },
        endereco: { cidade: 'São Paulo' },
        dados_medicos: { tipoSanguineo: 'O+' },
        convenio: { temConvenio: false }
      });
    
    if (insertError && !insertError.message.includes('violates foreign key constraint')) {
      console.error('❌ Test insert failed:', insertError.message);
      return false;
    }
    
    // Clean up test data if it was inserted
    if (!insertError) {
      await supabase
        .from('pacientes')
        .delete()
        .eq('user_id', testUserId);
    }
    
    console.log('✅ Table structure fix completed successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log('- Added missing "contato" column to pacientes table');
    console.log('- Column type: jsonb with default value {}');
    console.log('- This should fix the onboarding error when saving patient data');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the fix
fixPacientesTable()
  .then(success => {
    if (success) {
      console.log('🎉 Fix completed successfully!');
      process.exit(0);
    } else {
      console.log('💥 Fix failed. Please check the errors above.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });