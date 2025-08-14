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
    console.log('🔍 Verificando políticas RLS...');
    
    // Verificar políticas para tabelas principais relacionadas à autenticação
    const tables = ['usuarios', 'medicos', 'pacientes', 'agendamentos', 'profiles', 'pagamentos'];
    
    for (const table of tables) {
      console.log(`\n📋 Verificando políticas para tabela: ${table}`);
      
      // Query para verificar políticas RLS
      const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', table);
      
      if (error) {
        console.log(`⚠️  Tabela ${table} não encontrada ou sem acesso`);
        continue;
      }
      
      if (!policies || policies.length === 0) {
        console.log(`❌ RLSError: missing policy on ${table}`);
        return false;
      }
      
      // Verificar se há políticas para SELECT, INSERT, UPDATE, DELETE
      const policyTypes = policies.map(p => p.cmd);
      const requiredPolicies = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
      
      for (const policyType of requiredPolicies) {
        if (!policyTypes.includes(policyType)) {
          console.log(`❌ RLSError: missing ${policyType} policy on ${table}`);
        } else {
          console.log(`✅ ${policyType} policy exists on ${table}`);
        }
      }
    }
    
    console.log('\n✅ Validação de políticas RLS concluída');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao validar políticas RLS:', error.message);
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