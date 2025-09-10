import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing MedicoService operations...\n');

async function testMedicoServiceOperations() {
  // Test the exact same operations as MedicoService
  
  console.log('1. Testing SELECT with dados_profissionais...');
  try {
    const { data, error } = await supabase
      .from('medicos')
      .select('configuracoes, dados_profissionais')
      .eq('user_id', '00000000-0000-0000-0000-000000000000') // Fake UUID for testing
      .maybeSingle();

    if (error) {
      console.log('❌ SELECT Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ SELECT Success');
    }
  } catch (err) {
    console.log('❌ SELECT Exception:', err.message);
  }

  console.log('\n2. Testing INSERT with dados_profissionais...');
  try {
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000001', // Fake UUID
      crm: 'TEST-123',
      especialidades: ['Teste'],
      telefone: '11999999999',
      dados_profissionais: { nome: 'Dr. Teste', especialidade: 'Teste' },
      configuracoes: {},
      verificacao: {}
    };

    const { data, error } = await supabase
      .from('medicos')
      .insert(testData);

    if (error) {
      console.log('❌ INSERT Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      
      if (error.code === 'PGRST204') {
        console.log('🎯 Found the PGRST204 error! This is the schema cache issue.');
      }
    } else {
      console.log('✅ INSERT Success');
      console.log('🧹 Cleaning up test record...');
      
      // Clean up the test record
      await supabase
        .from('medicos')
        .delete()
        .eq('user_id', testData.user_id);
    }
  } catch (err) {
    console.log('❌ INSERT Exception:', err.message);
  }

  console.log('\n3. Testing UPDATE with dados_profissionais...');
  try {
    const { data, error } = await supabase
      .from('medicos')
      .update({ dados_profissionais: { updated: true } })
      .eq('user_id', '00000000-0000-0000-0000-000000000000'); // Fake UUID

    if (error) {
      console.log('❌ UPDATE Error:', error.message);
      console.log('   Code:', error.code);
      
      if (error.code === 'PGRST204') {
        console.log('🎯 Found the PGRST204 error in UPDATE operation!');
      }
    } else {
      console.log('✅ UPDATE Success');
    }
  } catch (err) {
    console.log('❌ UPDATE Exception:', err.message);
  }
}

await testMedicoServiceOperations();

console.log('\n📋 Summary:');
console.log('If you see PGRST204 errors above, it confirms the schema cache issue.');
console.log('The solution is to refresh the PostgREST schema cache in Supabase.');