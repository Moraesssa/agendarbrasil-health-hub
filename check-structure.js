import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRealStructure() {
  console.log('=== VERIFICAÇÃO DETALHADA DAS TABELAS ===\n');
  
  // Verificar tabela medicos
  try {
    const { data: medicos, error } = await supabase
      .from('medicos')
      .select('*')
      .limit(1);
    
    if (medicos && medicos.length > 0) {
      console.log('✅ Tabela medicos - Colunas:', Object.keys(medicos[0]));
    } else if (error) {
      console.log('❌ Tabela medicos - Erro:', error.message);
    } else {
      console.log('⚠️ Tabela medicos - Vazia, verificando estrutura...');
      
      // Tentar inserir um registro de teste para ver a estrutura
      const testId = '00000000-0000-0000-0000-000000000000';
      const { error: insertError } = await supabase
        .from('medicos')
        .insert({ id: testId })
        .select();
      
      if (insertError) {
        console.log('Estrutura esperada baseada no erro:', insertError.message);
      }
    }
  } catch (e) {
    console.log('❌ Exceção medicos:', e.message);
  }
  
  // Verificar tabela profiles
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Tabela profiles - Colunas:', Object.keys(profiles[0]));
    } else if (error) {
      console.log('❌ Tabela profiles - Erro:', error.message);
    } else {
      console.log('⚠️ Tabela profiles - Vazia');
    }
  } catch (e) {
    console.log('❌ Exceção profiles:', e.message);
  }
  
  // Verificar relacionamento correto
  console.log('\n=== TESTANDO RELACIONAMENTOS ===');
  
  try {
    // Tentar diferentes combinações de join
    const joins = [
      'profiles(id, nome, email)',
      'profiles(id, display_name, email)', 
      'profiles(id, name, email)',
      'profiles(*)'
    ];
    
    for (const joinStr of joins) {
      try {
        const { data, error } = await supabase
          .from('medicos')
          .select(`id, user_id, ${joinStr}`)
          .limit(1);
        
        if (!error) {
          console.log('✅ Join funcionou:', joinStr);
          if (data && data.length > 0) {
            console.log('   Estrutura:', JSON.stringify(data[0], null, 2));
          }
          break;
        } else {
          console.log('❌ Join falhou:', joinStr, '-', error.message);
        }
      } catch (e) {
        console.log('❌ Exceção no join:', joinStr, '-', e.message);
      }
    }
  } catch (e) {
    console.log('❌ Erro geral nos joins:', e.message);
  }
  
  // Verificar se há dados de exemplo e inserir se necessário
  console.log('\n=== INSERINDO DADOS DE TESTE ===');
  
  try {
    const userId = '11111111-1111-1111-1111-111111111111';
    
    // Inserir em profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: 'Dr. João Silva',
        email: 'joao.silva@example.com'
      });
    
    if (profileError) {
      console.log('❌ Erro ao inserir profile:', profileError.message);
    } else {
      console.log('✅ Profile inserido');
    }
    
    // Inserir médico
    const { error: medicoError } = await supabase
      .from('medicos')
      .upsert({
        id: userId,
        user_id: userId,
        crm: 'CRM-SP 123456',
        especialidades: ['Cardiologia'],
        is_active: true,
        aceita_teleconsulta: true,
        aceita_consulta_presencial: true
      });
    
    if (medicoError) {
      console.log('❌ Erro ao inserir médico:', medicoError.message);
    } else {
      console.log('✅ Médico inserido');
    }
    
    // Testar query corrigida
    console.log('\n=== TESTANDO QUERY CORRIGIDA ===');
    
    const { data: result, error: queryError } = await supabase
      .from('medicos')
      .select(`
        *,
        profiles(*)
      `)
      .eq('is_active', true)
      .limit(1);
    
    if (queryError) {
      console.log('❌ Query falhou:', queryError.message);
    } else {
      console.log('✅ Query funcionou!');
      console.log('Resultado:', JSON.stringify(result, null, 2));
    }
    
  } catch (e) {
    console.log('❌ Erro na inserção/teste:', e.message);
  }
}

checkRealStructure().catch(console.error);