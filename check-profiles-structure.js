#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// replaced by kiro @2025-08-16T00:00:00.000Z
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkProfilesStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela profiles...\n');
    
    // Verificar estrutura da tabela profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela profiles:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Estrutura da tabela profiles encontrada:');
      console.log('📋 Colunas disponíveis:', Object.keys(data[0]));
      console.log('📄 Exemplo de registro:', JSON.stringify(data[0], null, 2));
      
      // Verificar quantos profiles existem por tipo
      const { data: countData, error: countError } = await supabase
        .from('profiles')
        .select('user_type')
        .not('user_type', 'is', null);
      
      if (!countError && countData) {
        const typeCounts = countData.reduce((acc, profile) => {
          acc[profile.user_type] = (acc[profile.user_type] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📊 Distribuição por tipo de usuário:');
        Object.entries(typeCounts).forEach(([type, count]) => {
          console.log(`  ${type}: ${count} registros`);
        });
      }
    } else {
      console.log('⚠️  Tabela profiles está vazia');
      
      // Tentar inserir um registro de teste para ver quais colunas são aceitas
      console.log('🧪 Testando inserção para verificar estrutura...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          display_name: 'Teste Debug'
        });
      
      if (insertError) {
        console.log('❌ Erro ao inserir teste:', insertError.message);
        console.log('💡 Isso nos ajuda a entender a estrutura da tabela');
      } else {
        console.log('✅ Inserção de teste bem-sucedida');
        
        // Remover o registro de teste
        await supabase
          .from('profiles')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000');
        
        console.log('🧹 Registro de teste removido');
      }
    }
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
}

checkProfilesStructure();