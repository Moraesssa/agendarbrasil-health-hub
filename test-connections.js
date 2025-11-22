/**
 * Test database and external service connections
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function testConnections() {
  console.log('🔍 Testando conexões...\n');

  // Test Supabase connection
  console.log('1. Testando conexão com Supabase...');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variáveis do Supabase não configuradas');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple health check
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`❌ Erro na conexão: ${error.message}`);
      return false;
    }

    console.log('✅ Conexão com Supabase estabelecida');
    return true;

  } catch (error) {
    console.log(`❌ Erro na conexão: ${error.message}`);
    return false;
  }
}

testConnections()
  .then(success => {
    if (success) {
      console.log('\n✅ Todas as conexões estão funcionando!');
      process.exit(0);
    } else {
      console.log('\n❌ Algumas conexões falharam.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erro durante teste de conexões:', error);
    process.exit(1);
  });