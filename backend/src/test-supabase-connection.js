// src/test-supabase-connection.js
require('dotenv').config();
const { createServiceClient } = require('./config/supabase');

async function testSupabaseConnection() {
  try {
    console.log('Testando conexão com o Supabase...');
    
    // Criar cliente do Supabase
    const supabase = createServiceClient();
    
    // Testar conexão com uma consulta simples
    const { data, error } = await supabase
      .from('medicos')
      .select('id, nome')
      .limit(1);
    
    if (error) {
      console.error('Erro ao conectar com o Supabase:', error.message);
      return false;
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso!');
    console.log('Dados de exemplo:', data);
    
    // Testar tabelas existentes
    console.log('\nVerificando tabelas existentes...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.log('Não foi possível listar as tabelas. Isso pode ocorrer se a função RPC "get_tables" não estiver definida.');
      console.log('Você pode criar essa função no Supabase SQL Editor com o seguinte código:');
      console.log(`
        CREATE OR REPLACE FUNCTION get_tables()
        RETURNS TABLE (table_name text)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT tablename::text
          FROM pg_tables
          WHERE schemaname = 'public';
        END;
        $$;
      `);
    } else {
      console.log('Tabelas encontradas:', tables);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao testar conexão com o Supabase:', error.message);
    return false;
  }
}

// Executar o teste
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\nTeste de conexão concluído com sucesso!');
    } else {
      console.log('\nTeste de conexão falhou. Verifique as credenciais e a configuração.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  });