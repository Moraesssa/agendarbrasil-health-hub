import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing dados_profissionais column access...\n');

try {
  const { data, error } = await supabase
    .from('medicos')
    .select('id, crm, dados_profissionais')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('🔧 This confirms the schema cache issue');
  } else {
    console.log('✅ Success! Column is accessible');
    console.log('📊 Data:', data);
  }
} catch (err) {
  console.log('❌ Unexpected error:', err.message);
}