import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 VERIFICAÇÃO RÁPIDA DO SCHEMA E USUÁRIOS');
  console.log('=' .repeat(50));
  
  // 1. Verificar tabelas básicas
  console.log('\n📋 VERIFICANDO TABELAS PRINCIPAIS:');
  
  const tables = ['profiles', 'medicos', 'pacientes', 'locais_atendimento', 'consultas'];
  
  for (const table of tables) {
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
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  // 2. Verificar estrutura da tabela profiles
  console.log('\n🔍 ESTRUTURA DA TABELA PROFILES:');
  
  try {
    const { data: sample, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar profiles:', error.message);
    } else if (sample && sample.length > 0) {
      console.log('✅ Colunas encontradas:', Object.keys(sample[0]));
      console.log('Exemplo:', sample[0]);
    } else {
      console.log('⚠️ Tabela profiles existe mas está vazia');
      
      // Tentar inserir um usuário de teste
      console.log('\n🧪 TESTANDO INSERÇÃO:');
      
      const testUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'teste@example.com',
        display_name: 'Usuário Teste'
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(testUser);
      
      if (insertError) {
        console.log('❌ Erro na inserção:', insertError.message);
        console.log('💡 Isso pode indicar campos obrigatórios faltando ou RLS bloqueando');
      } else {
        console.log('✅ Inserção bem-sucedida!');
        
        // Verificar se apareceu
        const { data: inserted } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', testUser.id);
        
        if (inserted && inserted.length > 0) {
          console.log('✅ Usuário inserido encontrado:', inserted[0]);
        } else {
          console.log('⚠️ Usuário inserido mas não aparece na consulta (possível RLS)');
        }
        
        // Limpar teste
        await supabase.from('profiles').delete().eq('id', testUser.id);
      }
    }
  } catch (e) {
    console.log('❌ Exceção ao verificar profiles:', e.message);
  }
  
  // 3. Verificar se há usuários "órfãos" na autenticação
  console.log('\n👥 VERIFICANDO USUÁRIOS NA AUTENTICAÇÃO:');
  
  try {
    // Tentar uma abordagem indireta - verificar se conseguimos criar um usuário
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: 'teste-sync@example.com',
      password: 'teste123456'
    });
    
    if (authError) {
      console.log('❌ Erro ao testar criação de usuário:', authError.message);
    } else {
      console.log('✅ Sistema de autenticação funcionando');
      
      if (authUser.user) {
        console.log('📧 Usuário criado:', authUser.user.email);
        
        // Verificar se apareceu automaticamente na tabela profiles
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.user.id);
          
          if (profile && profile.length > 0) {
            console.log('✅ Profile criado automaticamente via trigger');
          } else {
            console.log('⚠️ Profile NÃO foi criado automaticamente - TRIGGER AUSENTE');
            console.log('💡 Este é provavelmente o motivo dos usuários ficarem "presos"');
          }
        }, 2000);
      }
    }
  } catch (e) {
    console.log('❌ Erro ao verificar autenticação:', e.message);
  }
  
  // 4. Verificar RLS
  console.log('\n🔒 VERIFICANDO RLS:');
  
  const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  
  try {
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('✅ RLS ativo - usuário anônimo bloqueado:', anonError.message);
    } else {
      console.log('⚠️ RLS inativo ou permissivo - usuário anônimo pode acessar:', anonData?.length || 0, 'registros');
    }
  } catch (e) {
    console.log('✅ RLS bloqueou acesso anônimo:', e.message);
  }
}

checkSchema().catch(console.error);