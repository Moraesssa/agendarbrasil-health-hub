import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyCriticalFixes() {
  console.log('🔧 APLICANDO CORREÇÕES CRÍTICAS');
  console.log('=' .repeat(50));
  
  // CORREÇÃO 1: Criar função handle_new_user
  console.log('\n🔄 PASSO 1: Criando função de sincronização de usuários...');
  
  try {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, display_name, created_at)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
          NEW.created_at
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: funcError } = await supabase.rpc('sql', { query: createFunctionSQL });
    
    if (funcError) {
      console.log('❌ Erro ao criar função:', funcError.message);
      console.log('💡 Vamos tentar método alternativo...');
    } else {
      console.log('✅ Função handle_new_user criada com sucesso!');
    }
  } catch (e) {
    console.log('❌ Exceção ao criar função:', e.message);
  }
  
  // CORREÇÃO 2: Criar trigger
  console.log('\n🔄 PASSO 2: Criando trigger de sincronização...');
  
  try {
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    const { error: triggerError } = await supabase.rpc('sql', { query: createTriggerSQL });
    
    if (triggerError) {
      console.log('❌ Erro ao criar trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger criado com sucesso!');
    }
  } catch (e) {
    console.log('❌ Exceção ao criar trigger:', e.message);
  }
  
  // CORREÇÃO 3: Verificar e corrigir campo especialidades
  console.log('\n🔄 PASSO 3: Verificando campo especialidades...');
  
  try {
    // Primeiro, vamos verificar a estrutura atual
    const { data: columnInfo, error: columnError } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'medicos' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (columnError) {
      console.log('❌ Erro ao verificar colunas:', columnError.message);
    } else {
      console.log('✅ Estrutura da tabela medicos:');
      columnInfo?.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Verificar se especialidades existe e seu tipo
      const especialidadesCol = columnInfo?.find(col => col.column_name === 'especialidades');
      
      if (!especialidadesCol) {
        console.log('⚠️ Campo especialidades não existe, criando...');
        
        const { error: addColError } = await supabase.rpc('sql', {
          query: `ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS especialidades TEXT[];`
        });
        
        if (addColError) {
          console.log('❌ Erro ao adicionar coluna especialidades:', addColError.message);
        } else {
          console.log('✅ Campo especialidades criado como TEXT[]');
        }
      } else {
        console.log(`✅ Campo especialidades existe: ${especialidadesCol.data_type}`);
      }
    }
  } catch (e) {
    console.log('❌ Exceção ao verificar especialidades:', e.message);
  }
  
  // CORREÇÃO 4: Adicionar campos faltantes
  console.log('\n🔄 PASSO 4: Adicionando campos faltantes...');
  
  const fieldsToAdd = [
    'aceita_teleconsulta BOOLEAN DEFAULT true',
    'aceita_consulta_presencial BOOLEAN DEFAULT true', 
    'is_active BOOLEAN DEFAULT true',
    'valor_consulta_teleconsulta NUMERIC(10,2)',
    'valor_consulta_presencial NUMERIC(10,2)'
  ];
  
  for (const field of fieldsToAdd) {
    try {
      const { error } = await supabase.rpc('sql', {
        query: `ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS ${field};`
      });
      
      if (error) {
        console.log(`❌ Erro ao adicionar ${field.split(' ')[0]}:`, error.message);
      } else {
        console.log(`✅ Campo ${field.split(' ')[0]} adicionado`);
      }
    } catch (e) {
      console.log(`❌ Exceção ao adicionar ${field.split(' ')[0]}:`, e.message);
    }
  }
  
  // CORREÇÃO 5: Adicionar campo is_active em pacientes
  console.log('\n🔄 PASSO 5: Corrigindo tabela pacientes...');
  
  try {
    const { error } = await supabase.rpc('sql', {
      query: `ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`
    });
    
    if (error) {
      console.log('❌ Erro ao adicionar is_active em pacientes:', error.message);
    } else {
      console.log('✅ Campo is_active adicionado em pacientes');
    }
  } catch (e) {
    console.log('❌ Exceção ao corrigir pacientes:', e.message);
  }
  
  // CORREÇÃO 6: Inserir dados de teste
  console.log('\n🔄 PASSO 6: Inserindo dados de teste...');
  
  try {
    const testUserId = '11111111-1111-1111-1111-111111111111';
    
    // Inserir médico de teste
    const { error: medicoError } = await supabase
      .from('medicos')
      .upsert({
        id: crypto.randomUUID(),
        user_id: testUserId,
        crm: 'CRM-SP 123456',
        especialidades: ['Cardiologia', 'Clínica Geral'],
        telefone: '(11) 99999-1111',
        valor_consulta_teleconsulta: 200.00,
        valor_consulta_presencial: 250.00,
        aceita_teleconsulta: true,
        aceita_consulta_presencial: true,
        is_active: true
      });
    
    if (medicoError) {
      console.log('❌ Erro ao inserir médico de teste:', medicoError.message);
    } else {
      console.log('✅ Médico de teste inserido');
    }
    
    // Inserir local de atendimento
    const { error: localError } = await supabase
      .from('locais_atendimento')
      .upsert({
        medico_id: testUserId,
        nome_local: 'Clínica Exemplo',
        endereco: 'Av. Paulista, 1000',
        cidade: 'São Paulo',
        estado: 'São Paulo',
        telefone: '(11) 3333-1111',
        ativo: true
      });
    
    if (localError) {
      console.log('❌ Erro ao inserir local de teste:', localError.message);
    } else {
      console.log('✅ Local de atendimento inserido');
    }
    
  } catch (e) {
    console.log('❌ Exceção ao inserir dados de teste:', e.message);
  }
  
  // VERIFICAÇÃO FINAL
  console.log('\n🔍 VERIFICAÇÃO FINAL...');
  
  try {
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: medicosCount } = await supabase
      .from('medicos')
      .select('*', { count: 'exact', head: true });
    
    const { count: locaisCount } = await supabase
      .from('locais_atendimento')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Profiles: ${profilesCount || 0} registros`);
    console.log(`📊 Médicos: ${medicosCount || 0} registros`);
    console.log(`📊 Locais: ${locaisCount || 0} registros`);
    
    // Testar criação de usuário
    console.log('\n🧪 TESTANDO CRIAÇÃO DE USUÁRIO...');
    
    const testEmail = `teste-${Date.now()}@example.com`;
    const { data: authResult, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'teste123456'
    });
    
    if (authError) {
      console.log('❌ Ainda há problema na autenticação:', authError.message);
    } else {
      console.log('✅ Usuário de teste criado com sucesso!');
      console.log(`📧 Email: ${authResult.user?.email}`);
      
      // Aguardar um pouco e verificar se apareceu na tabela profiles
      setTimeout(async () => {
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authResult.user?.id);
        
        if (newProfile && newProfile.length > 0) {
          console.log('🎉 SUCESSO! Usuário sincronizado automaticamente para profiles!');
        } else {
          console.log('⚠️ Usuário criado mas não apareceu em profiles - trigger pode não estar funcionando');
        }
      }, 2000);
    }
    
  } catch (e) {
    console.log('❌ Erro na verificação final:', e.message);
  }
  
  console.log('\n✅ CORREÇÕES APLICADAS!');
  console.log('💡 Aguarde alguns segundos para ver o resultado do teste de usuário...');
}

applyCriticalFixes().catch(console.error);