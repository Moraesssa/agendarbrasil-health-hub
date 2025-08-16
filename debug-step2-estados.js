#!/usr/bin/env node

/**
 * Script de Debug URGENTE - Step 2 Estados
 * Investigar por que nenhum estado está disponível
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🚨 DEBUG URGENTE: Step 2 - Nenhum estado disponível');
console.log('==================================================\n');

async function debugStep2() {
  try {
    // 1. Testar função get_available_states
    console.log('1️⃣ Testando função get_available_states...');
    const { data: estados, error: estadosError } = await supabase
      .rpc('get_available_states');
    
    if (estadosError) {
      console.error('❌ ERRO na função get_available_states:', estadosError.message);
    } else {
      console.log(`📊 Estados retornados: ${estados?.length || 0}`);
      console.log(`📋 Lista: ${JSON.stringify(estados)}`);
    }

    // 2. Verificar se a função existe (método alternativo)
    console.log('\n2️⃣ Verificando se função get_available_states existe...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'get_available_states');
    
    if (funcError) {
      console.error('❌ Erro ao verificar função:', funcError.message);
    } else {
      if (functions && functions.length > 0) {
        console.log('✅ Função get_available_states existe');
      } else {
        console.log('❌ Função get_available_states NÃO EXISTE');
      }
    }

    // 3. Verificar dados brutos na tabela locais_atendimento
    console.log('\n3️⃣ Verificando dados brutos em locais_atendimento...');
    const { data: locais, error: locaisError } = await supabase
      .from('locais_atendimento')
      .select('estado, is_active, medico_id')
      .eq('is_active', true);
    
    if (locaisError) {
      console.error('❌ Erro ao buscar locais:', locaisError.message);
    } else {
      console.log(`📊 Total locais ativos: ${locais?.length || 0}`);
      if (locais && locais.length > 0) {
        const estadosUnicos = [...new Set(locais.map(l => l.estado))];
        console.log(`📋 Estados únicos nos locais: ${estadosUnicos.join(', ')}`);
      }
    }

    // 4. Verificar médicos com verificação aprovada
    console.log('\n4️⃣ Verificando médicos aprovados...');
    const { data: medicos, error: medicosError } = await supabase
      .from('medicos')
      .select('id, verificacao');
    
    if (medicosError) {
      console.error('❌ Erro ao buscar médicos:', medicosError.message);
    } else {
      console.log(`📊 Total médicos: ${medicos?.length || 0}`);
      const aprovados = medicos?.filter(m => 
        m.verificacao?.aprovado === 'true' || 
        JSON.stringify(m.verificacao) === '{}'
      ) || [];
      console.log(`✅ Médicos aprovados: ${aprovados.length}`);
    }

    // 5. Testar query manual da função get_available_states
    console.log('\n5️⃣ Testando query manual equivalente...');
    const { data: queryManual, error: queryError } = await supabase
      .from('locais_atendimento')
      .select(`
        estado,
        medicos!inner(verificacao)
      `)
      .eq('is_active', true);
    
    if (queryError) {
      console.error('❌ Erro na query manual:', queryError.message);
    } else {
      console.log(`📊 Resultados query manual: ${queryManual?.length || 0}`);
      if (queryManual && queryManual.length > 0) {
        const estadosValidos = queryManual
          .filter(item => {
            const medico = item.medicos;
            return medico?.verificacao?.aprovado === 'true' || 
                   JSON.stringify(medico?.verificacao) === '{}';
          })
          .map(item => item.estado);
        
        const estadosUnicos = [...new Set(estadosValidos)];
        console.log(`📋 Estados válidos: ${estadosUnicos.join(', ')}`);
      }
    }

    // 6. Recriar função get_available_states se necessário
    console.log('\n6️⃣ Tentando recriar função get_available_states...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.get_available_states()
      RETURNS TABLE(uf TEXT, nome TEXT)
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT DISTINCT 
          l.estado as uf,
          l.estado as nome
        FROM public.locais_atendimento l
        JOIN public.medicos m ON m.id = l.medico_id
        WHERE l.is_active = true 
          AND (m.verificacao->>'aprovado' = 'true' OR m.verificacao = '{}'::jsonb)
        ORDER BY l.estado;
      $$;
    `;
    
    try {
      // Não posso executar SQL diretamente, mas posso sugerir
      console.log('📝 SQL para recriar a função:');
      console.log(createFunctionSQL);
    } catch (error) {
      console.error('❌ Erro ao recriar função:', error);
    }

    // 7. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO STEP 2');
    console.log('====================');
    
    if (!estados || estados.length === 0) {
      console.log('❌ PROBLEMA CONFIRMADO: get_available_states retorna vazio');
      console.log('🔧 POSSÍVEIS CAUSAS:');
      console.log('   1. Função get_available_states foi corrompida/removida');
      console.log('   2. JOIN entre locais_atendimento e medicos falhou');
      console.log('   3. Condições de verificacao muito restritivas');
      console.log('   4. Dados inconsistentes após migrações');
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

debugStep2().then(() => {
  console.log('\n🏁 Debug Step 2 concluído');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});