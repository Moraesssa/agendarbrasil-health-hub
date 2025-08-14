// Script para validar políticas RLS no Supabase
// replaced by kiro @2025-01-08T15:30:00.000Z

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateRLSPolicies() {
  try {
    console.log('🔍 Extraindo configuração completa de RLS...');

    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd, qual')
      .eq('schemaname', 'public')
      .order('tablename');

    if (error) {
      console.error('❌ Erro ao buscar políticas RLS:', error.message);
      return false;
    }

    if (!policies || policies.length === 0) {
      console.log('⚠️ Nenhuma política RLS encontrada no schema public.');
      return true;
    }

    let currentTable = '';
    for (const policy of policies) {
      if (policy.tablename !== currentTable) {
        currentTable = policy.tablename;
        console.log(`\n--- Tabela: ${currentTable} ---`);
      }
      console.log(`  -> Política: ${policy.policyname}`);
      console.log(`     Comando: ${policy.cmd}`);
      console.log(`     Definição: ${policy.qual}`);
    }

    console.log('\n✅ Extração de políticas RLS concluída.');
    return true;

  } catch (error) {
    console.error('❌ Erro ao extrair políticas RLS:', error.message);
    return false;
  }
}

// Executar validação
validateRLSPolicies()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  });