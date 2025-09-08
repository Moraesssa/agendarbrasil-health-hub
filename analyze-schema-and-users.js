import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SchemaAnalyzer {
  
  async analyzeComplete() {
    console.log('🔍 ANÁLISE COMPLETA DO SCHEMA E USUÁRIOS');
    console.log('=' .repeat(60));
    
    try {
      // 1. Listar todas as tabelas do schema público
      await this.listAllPublicTables();
      
      // 2. Analisar usuários na autenticação vs tabelas
      await this.analyzeUserDiscrepancy();
      
      // 3. Verificar estrutura das tabelas de usuários
      await this.analyzeUserTables();
      
      // 4. Verificar triggers e funções automáticas
      await this.checkTriggersAndFunctions();
      
      // 5. Verificar políticas RLS que podem estar bloqueando
      await this.checkRLSPolicies();
      
      // 6. Tentar sincronizar usuários
      await this.attemptUserSync();
      
    } catch (error) {
      console.error('❌ ERRO NA ANÁLISE:', error.message);
    }
  }
  
  async listAllPublicTables() {
    console.log('\n📋 TODAS AS TABELAS DO SCHEMA PÚBLICO');
    console.log('-'.repeat(50));
    
    try {
      // Usar query SQL direta para listar tabelas
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            t.table_name,
            t.table_type,
            COALESCE(
              (SELECT COUNT(*) 
               FROM information_schema.columns c 
               WHERE c.table_name = t.table_name 
                 AND c.table_schema = 'public'), 0
            ) as column_count
          FROM information_schema.tables t
          WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
          ORDER BY t.table_name;
        `
      });
      
      if (error) {
        // Fallback: tentar listar tabelas conhecidas
        console.log('⚠️ Usando método alternativo...');
        await this.listKnownTables();
        return;
      }
      
      console.log(`Encontradas ${data?.length || 0} tabelas:`);
      
      for (const table of data || []) {
        console.log(`📊 ${table.table_name} (${table.column_count} colunas)`);
        
        // Contar registros em cada tabela
        await this.countTableRows(table.table_name);
      }
      
    } catch (error) {
      console.log('❌ Erro ao listar tabelas:', error.message);
      await this.listKnownTables();
    }
  }
  
  async listKnownTables() {
    const knownTables = [
      'profiles', 'user_profiles', 'medicos', 'pacientes', 
      'locais_atendimento', 'consultas', 'usuarios',
      'horarios_funcionamento', 'horarios_disponibilidade'
    ];
    
    console.log('Verificando tabelas conhecidas:');
    
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} registros`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: ${e.message}`);
      }
    }
  }
  
  async countTableRows(tableName) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`    ❌ Erro ao contar: ${error.message}`);
      } else {
        console.log(`    📊 Registros: ${count || 0}`);
      }
    } catch (e) {
      console.log(`    ❌ Exceção: ${e.message}`);
    }
  }
  
  async analyzeUserDiscrepancy() {
    console.log('\n👥 ANÁLISE DE DISCREPÂNCIA DE USUÁRIOS');
    console.log('-'.repeat(50));
    
    try {
      // 1. Verificar usuários na autenticação (auth.users)
      console.log('1. Verificando usuários na autenticação...');
      
      const { data: authUsers, error: authError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            COUNT(*) as total_auth_users,
            COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_users
          FROM auth.users;
        `
      });
      
      if (authError) {
        console.log('❌ Erro ao acessar auth.users:', authError.message);
      } else {
        const stats = authUsers[0];
        console.log(`✅ Usuários na autenticação: ${stats.total_auth_users}`);
        console.log(`   - Confirmados: ${stats.confirmed_users}`);
        console.log(`   - Criados nos últimos 7 dias: ${stats.recent_users}`);
      }
      
      // 2. Verificar usuários nas tabelas públicas
      console.log('\n2. Verificando usuários nas tabelas públicas...');
      
      const userTables = ['profiles', 'user_profiles', 'usuarios'];
      
      for (const table of userTables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`❌ ${table}: ${error.message}`);
          } else {
            console.log(`✅ ${table}: ${count || 0} registros`);
          }
        } catch (e) {
          console.log(`❌ ${table}: Tabela não existe ou inacessível`);
        }
      }
      
      // 3. Verificar se há trigger de sincronização
      console.log('\n3. Verificando triggers de sincronização...');
      
      const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement
          FROM information_schema.triggers
          WHERE trigger_schema = 'public'
            OR event_object_table IN ('users', 'profiles', 'user_profiles')
          ORDER BY trigger_name;
        `
      });
      
      if (triggerError) {
        console.log('❌ Erro ao verificar triggers:', triggerError.message);
      } else {
        console.log(`Encontrados ${triggers?.length || 0} triggers:`);
        for (const trigger of triggers || []) {
          console.log(`  🔧 ${trigger.trigger_name} em ${trigger.event_object_table}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Erro na análise de usuários:', error.message);
    }
  }
  
  async analyzeUserTables() {
    console.log('\n🔍 ANÁLISE DETALHADA DAS TABELAS DE USUÁRIOS');
    console.log('-'.repeat(50));
    
    // Verificar estrutura da tabela profiles
    try {
      console.log('1. Analisando tabela profiles...');
      
      const { data: profilesStructure, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'profiles'
          ORDER BY ordinal_position;
        `
      });
      
      if (error) {
        console.log('❌ Erro ao analisar profiles:', error.message);
      } else {
        console.log('✅ Estrutura da tabela profiles:');
        for (const col of profilesStructure || []) {
          console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        }
      }
      
      // Tentar inserir um usuário de teste
      console.log('\n2. Testando inserção na tabela profiles...');
      
      const testUserId = '00000000-0000-0000-0000-000000000001';
      
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: testUserId,
          display_name: 'Usuário Teste',
          email: 'teste@example.com'
        });
      
      if (insertError) {
        console.log('❌ Erro ao inserir teste:', insertError.message);
      } else {
        console.log('✅ Inserção de teste bem-sucedida');
        
        // Remover o teste
        await supabase.from('profiles').delete().eq('id', testUserId);
      }
      
    } catch (error) {
      console.log('❌ Erro na análise de tabelas:', error.message);
    }
  }
  
  async checkTriggersAndFunctions() {
    console.log('\n⚙️ VERIFICANDO TRIGGERS E FUNÇÕES AUTOMÁTICAS');
    console.log('-'.repeat(50));
    
    try {
      // Verificar se existe função de criação automática de profile
      const { data: functions, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            routine_name,
            routine_type,
            routine_definition
          FROM information_schema.routines
          WHERE routine_schema = 'public'
            AND (
              routine_name ILIKE '%profile%' OR
              routine_name ILIKE '%user%' OR
              routine_name ILIKE '%auth%'
            )
          ORDER BY routine_name;
        `
      });
      
      if (error) {
        console.log('❌ Erro ao verificar funções:', error.message);
      } else {
        console.log(`Encontradas ${functions?.length || 0} funções relacionadas a usuários:`);
        for (const func of functions || []) {
          console.log(`  🔧 ${func.routine_name} (${func.routine_type})`);
        }
      }
      
      // Verificar se há função handle_new_user
      const { data: handleNewUser, error: handleError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT routine_definition
          FROM information_schema.routines
          WHERE routine_schema = 'public'
            AND routine_name = 'handle_new_user';
        `
      });
      
      if (handleError) {
        console.log('⚠️ Função handle_new_user não encontrada');
      } else if (handleNewUser && handleNewUser.length > 0) {
        console.log('✅ Função handle_new_user existe');
      } else {
        console.log('⚠️ Função handle_new_user não existe - usuários não são sincronizados automaticamente');
      }
      
    } catch (error) {
      console.log('❌ Erro ao verificar triggers:', error.message);
    }
  }
  
  async checkRLSPolicies() {
    console.log('\n🔒 VERIFICANDO POLÍTICAS RLS');
    console.log('-'.repeat(50));
    
    try {
      const { data: rlsStatus, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname = c.schemaname AND p.tablename = c.tablename) as policy_count
          FROM pg_tables c
          WHERE schemaname = 'public'
            AND tablename IN ('profiles', 'user_profiles', 'usuarios', 'medicos', 'pacientes')
          ORDER BY tablename;
        `
      });
      
      if (error) {
        console.log('❌ Erro ao verificar RLS:', error.message);
      } else {
        console.log('Status RLS das tabelas principais:');
        for (const table of rlsStatus || []) {
          const status = table.rls_enabled ? '🔒 ATIVO' : '🔓 INATIVO';
          console.log(`  ${table.tablename}: ${status} (${table.policy_count} políticas)`);
        }
      }
      
    } catch (error) {
      console.log('❌ Erro ao verificar RLS:', error.message);
    }
  }
  
  async attemptUserSync() {
    console.log('\n🔄 TENTATIVA DE SINCRONIZAÇÃO DE USUÁRIOS');
    console.log('-'.repeat(50));
    
    try {
      // 1. Verificar se podemos acessar auth.users
      console.log('1. Verificando acesso aos usuários de autenticação...');
      
      const { data: authUsers, error: authError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            id,
            email,
            created_at,
            email_confirmed_at IS NOT NULL as confirmed
          FROM auth.users
          LIMIT 5;
        `
      });
      
      if (authError) {
        console.log('❌ Não é possível acessar auth.users:', authError.message);
        return;
      }
      
      console.log(`✅ Encontrados usuários na autenticação. Exemplo:`);
      for (const user of authUsers || []) {
        console.log(`   ${user.email} (${user.confirmed ? 'confirmado' : 'não confirmado'})`);
      }
      
      // 2. Tentar criar profiles para usuários existentes
      console.log('\n2. Tentando sincronizar usuários...');
      
      for (const user of authUsers || []) {
        try {
          const { error: syncError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              display_name: user.email.split('@')[0],
              created_at: user.created_at
            });
          
          if (syncError) {
            console.log(`❌ Erro ao sincronizar ${user.email}:`, syncError.message);
          } else {
            console.log(`✅ Sincronizado: ${user.email}`);
          }
        } catch (e) {
          console.log(`❌ Exceção ao sincronizar ${user.email}:`, e.message);
        }
      }
      
      // 3. Verificar resultado
      const { count: finalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log(`\n📊 Total de profiles após sincronização: ${finalCount || 0}`);
      
    } catch (error) {
      console.log('❌ Erro na sincronização:', error.message);
    }
  }
}

// Executar análise
async function main() {
  const analyzer = new SchemaAnalyzer();
  await analyzer.analyzeComplete();
}

main().catch(console.error);