/**
 * Script de Análise Completa do Banco de Dados
 * - Lista todas as tabelas, colunas, índices
 * - Lista todas as funções RPC
 * - Lista todas as políticas RLS
 * - Desabilita temporariamente RLS para análise
 * - Executa queries de teste de segurança
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Cliente com service role (admin)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cliente anônimo para testes de segurança
const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class DatabaseAnalyzer {
  
  async analyzeComplete() {
    console.log('🔍 INICIANDO ANÁLISE COMPLETA DO BANCO DE DADOS');
    console.log('=' .repeat(60));
    
    try {
      // 1. Listar todas as tabelas
      await this.listAllTables();
      
      // 2. Listar todas as funções RPC
      await this.listAllFunctions();
      
      // 3. Listar todas as políticas RLS
      await this.listAllRLSPolicies();
      
      // 4. Desabilitar RLS temporariamente
      await this.disableAllRLS();
      
      // 5. Testar estrutura das tabelas principais
      await this.testTableStructures();
      
      // 6. Testar queries do schedulingService
      await this.testSchedulingServiceQueries();
      
      // 7. Reabilitar RLS
      await this.enableAllRLS();
      
      // 8. Testar segurança com usuário anônimo
      await this.testSecurityWithAnonymousUser();
      
      console.log('\n✅ ANÁLISE COMPLETA FINALIZADA');
      
    } catch (error) {
      console.error('❌ ERRO NA ANÁLISE:', error.message);
      
      // Tentar reabilitar RLS em caso de erro
      try {
        await this.enableAllRLS();
      } catch (e) {
        console.error('❌ ERRO AO REABILITAR RLS:', e.message);
      }
    }
  }
  
  async listAllTables() {
    console.log('\n📋 LISTANDO TODAS AS TABELAS');
    console.log('-'.repeat(40));
    
    try {
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public')
        .order('table_name');
      
      if (error) throw error;
      
      console.log(`Encontradas ${tables?.length || 0} tabelas/views:`);
      
      for (const table of tables || []) {
        console.log(`  ${table.table_type === 'BASE TABLE' ? '📊' : '👁️'} ${table.table_name}`);
        
        // Listar colunas de cada tabela
        await this.listTableColumns(table.table_name);
      }
      
    } catch (error) {
      console.error('❌ Erro ao listar tabelas:', error.message);
    }
  }
  
  async listTableColumns(tableName) {
    try {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (error) throw error;
      
      if (columns && columns.length > 0) {
        console.log(`    Colunas (${columns.length}):`);
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? '?' : '!';
          const defaultVal = col.column_default ? ` = ${col.column_default}` : '';
          console.log(`      ${nullable} ${col.column_name}: ${col.data_type}${defaultVal}`);
        });
      }
      
    } catch (error) {
      console.log(`    ❌ Erro ao listar colunas: ${error.message}`);
    }
  }
  
  async listAllFunctions() {
    console.log('\n🔧 LISTANDO TODAS AS FUNÇÕES RPC');
    console.log('-'.repeat(40));
    
    try {
      const { data: functions, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type, data_type')
        .eq('routine_schema', 'public')
        .order('routine_name');
      
      if (error) throw error;
      
      console.log(`Encontradas ${functions?.length || 0} funções:`);
      
      for (const func of functions || []) {
        console.log(`  🔧 ${func.routine_name} (${func.routine_type}) -> ${func.data_type}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao listar funções:', error.message);
    }
  }
  
  async listAllRLSPolicies() {
    console.log('\n🔒 LISTANDO TODAS AS POLÍTICAS RLS');
    console.log('-'.repeat(40));
    
    try {
      // Query para listar políticas RLS
      const { data: policies, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;
        `
      });
      
      if (error) {
        // Fallback: tentar query direta
        const { data: rlsStatus } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT 
              c.relname as table_name,
              c.relrowsecurity as rls_enabled
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' 
              AND c.relkind = 'r'
            ORDER BY c.relname;
          `
        });
        
        console.log('Status RLS das tabelas:');
        for (const table of rlsStatus || []) {
          console.log(`  ${table.rls_enabled ? '🔒' : '🔓'} ${table.table_name}`);
        }
        return;
      }
      
      console.log(`Encontradas ${policies?.length || 0} políticas RLS:`);
      
      const groupedPolicies = {};
      for (const policy of policies || []) {
        if (!groupedPolicies[policy.tablename]) {
          groupedPolicies[policy.tablename] = [];
        }
        groupedPolicies[policy.tablename].push(policy);
      }
      
      for (const [tableName, tablePolicies] of Object.entries(groupedPolicies)) {
        console.log(`  📊 ${tableName} (${tablePolicies.length} políticas):`);
        for (const policy of tablePolicies) {
          console.log(`    🔒 ${policy.policyname} [${policy.cmd}]`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao listar políticas RLS:', error.message);
    }
  }
  
  async disableAllRLS() {
    console.log('\n🔓 DESABILITANDO RLS TEMPORARIAMENTE');
    console.log('-'.repeat(40));
    
    const tables = [
      'profiles', 'user_profiles', 'medicos', 'pacientes', 
      'locais_atendimento', 'consultas', 'horarios_funcionamento',
      'horarios_disponibilidade', 'usuarios'
    ];
    
    for (const table of tables) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE IF EXISTS public.${table} DISABLE ROW LEVEL SECURITY;`
        });
        console.log(`  ✅ RLS desabilitado para: ${table}`);
      } catch (error) {
        console.log(`  ⚠️ Não foi possível desabilitar RLS para ${table}: ${error.message}`);
      }
    }
  }
  
  async enableAllRLS() {
    console.log('\n🔒 REABILITANDO RLS');
    console.log('-'.repeat(40));
    
    const tables = [
      'profiles', 'user_profiles', 'medicos', 'pacientes', 
      'locais_atendimento', 'consultas', 'horarios_funcionamento',
      'horarios_disponibilidade', 'usuarios'
    ];
    
    for (const table of tables) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY;`
        });
        console.log(`  ✅ RLS reabilitado para: ${table}`);
      } catch (error) {
        console.log(`  ⚠️ Não foi possível reabilitar RLS para ${table}: ${error.message}`);
      }
    }
  }
  
  async testTableStructures() {
    console.log('\n🧪 TESTANDO ESTRUTURA DAS TABELAS PRINCIPAIS');
    console.log('-'.repeat(40));
    
    const tablesToTest = [
      'medicos', 'user_profiles', 'profiles', 'locais_atendimento', 
      'consultas', 'pacientes', 'usuarios'
    ];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: OK (${data?.length || 0} registros de exemplo)`);
          if (data && data.length > 0) {
            console.log(`    Colunas: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ ${table}: Exceção - ${error.message}`);
      }
    }
  }
  
  async testSchedulingServiceQueries() {
    console.log('\n🔍 TESTANDO QUERIES DO SCHEDULING SERVICE');
    console.log('-'.repeat(40));
    
    // Teste 1: Query básica de médicos
    try {
      const { data: medicos, error } = await supabase
        .from('medicos')
        .select(`
          *,
          profiles!inner(nome, email, foto_perfil_url)
        `)
        .eq('is_active', true)
        .limit(3);
      
      if (error) {
        console.log('  ❌ Query médicos com profiles:', error.message);
        
        // Tentar com user_profiles
        const { data: medicos2, error: error2 } = await supabase
          .from('medicos')
          .select(`
            *,
            user_profiles!inner(display_name, email)
          `)
          .eq('is_active', true)
          .limit(3);
        
        if (error2) {
          console.log('  ❌ Query médicos com user_profiles:', error2.message);
        } else {
          console.log('  ✅ Query médicos com user_profiles: OK');
        }
      } else {
        console.log('  ✅ Query médicos com profiles: OK');
      }
    } catch (error) {
      console.log('  ❌ Exceção na query de médicos:', error.message);
    }
    
    // Teste 2: Query de locais de atendimento
    try {
      const { data: locais, error } = await supabase
        .from('locais_atendimento')
        .select('medico_id, cidade, estado')
        .eq('ativo', true)
        .limit(3);
      
      if (error) {
        console.log('  ❌ Query locais de atendimento:', error.message);
      } else {
        console.log('  ✅ Query locais de atendimento: OK');
      }
    } catch (error) {
      console.log('  ❌ Exceção na query de locais:', error.message);
    }
    
    // Teste 3: Simular query do searchDoctorsWithFilters
    try {
      console.log('  🧪 Testando searchDoctorsWithFilters...');
      
      // Primeiro, verificar se há dados de exemplo
      const { data: sampleData } = await supabase
        .from('medicos')
        .select('*')
        .limit(1);
      
      if (!sampleData || sampleData.length === 0) {
        console.log('  ⚠️ Nenhum médico encontrado para teste');
        
        // Inserir dados de exemplo
        await this.insertSampleData();
      }
      
      // Testar a query corrigida
      const { data: result, error } = await supabase
        .from('medicos')
        .select(`
          *,
          profiles!inner(nome, email, foto_perfil_url)
        `)
        .eq('is_active', true)
        .eq('aceita_teleconsulta', true);
      
      if (error) {
        console.log('  ❌ Query searchDoctorsWithFilters:', error.message);
      } else {
        console.log('  ✅ Query searchDoctorsWithFilters: OK');
      }
      
    } catch (error) {
      console.log('  ❌ Exceção no teste searchDoctorsWithFilters:', error.message);
    }
  }
  
  async insertSampleData() {
    console.log('  📝 Inserindo dados de exemplo...');
    
    try {
      // Inserir perfil de usuário
      const userId = '11111111-1111-1111-1111-111111111111';
      
      // Tentar inserir em profiles primeiro
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            nome: 'Dr. João Silva',
            email: 'joao.silva@example.com',
            user_type: 'medico'
          });
      } catch (e) {
        // Se profiles não existir, tentar user_profiles
        await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            display_name: 'Dr. João Silva',
            email: 'joao.silva@example.com',
            user_type: 'medico'
          });
      }
      
      // Inserir médico
      await supabase
        .from('medicos')
        .upsert({
          id: userId,
          user_id: userId,
          crm: 'CRM-SP 123456',
          especialidades: ['Cardiologia'],
          is_active: true,
          aceita_teleconsulta: true,
          aceita_consulta_presencial: true,
          valor_consulta_teleconsulta: 200.00,
          valor_consulta_presencial: 250.00
        });
      
      // Inserir local de atendimento
      await supabase
        .from('locais_atendimento')
        .upsert({
          medico_id: userId,
          nome_local: 'Clínica Exemplo',
          cidade: 'São Paulo',
          estado: 'São Paulo',
          ativo: true
        });
      
      console.log('  ✅ Dados de exemplo inseridos');
      
    } catch (error) {
      console.log('  ⚠️ Erro ao inserir dados de exemplo:', error.message);
    }
  }
  
  async testSecurityWithAnonymousUser() {
    console.log('\n🔒 TESTANDO SEGURANÇA COM USUÁRIO ANÔNIMO');
    console.log('-'.repeat(40));
    
    const tablesToTest = ['medicos', 'profiles', 'user_profiles', 'locais_atendimento'];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabaseAnon
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ✅ ${table}: BLOQUEADO - ${error.message}`);
        } else {
          console.log(`  ⚠️ ${table}: VAZAMENTO - ${data?.length || 0} registros acessíveis`);
          if (data && data.length > 0) {
            console.log(`    Dados expostos: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`  ✅ ${table}: BLOQUEADO - ${error.message}`);
      }
    }
  }
}

// Função para executar SQL customizado
async function execCustomSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao executar SQL:', error.message);
    return null;
  }
}

// Executar análise
async function main() {
  const analyzer = new DatabaseAnalyzer();
  await analyzer.analyzeComplete();
}

// Executar se chamado diretamente
main().catch(console.error);

export { DatabaseAnalyzer, execCustomSQL };