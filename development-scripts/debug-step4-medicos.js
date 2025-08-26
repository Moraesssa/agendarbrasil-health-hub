#!/usr/bin/env node

/**
 * Script de Debug - Step 4 Médicos
 * Investiga por que os médicos não aparecem no passo 4 do agendamento
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.error('Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 INVESTIGAÇÃO: Step 4 - Médicos não aparecem');
console.log('================================================\n');

async function debugStep4() {
  try {
    // 1. Verificar conexão com Supabase
    console.log('1️⃣ Testando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // 2. Verificar se existem médicos na tabela
    console.log('2️⃣ Verificando médicos cadastrados...');
    const { data: medicos, error: medicosError } = await supabase
      .from('medicos')
      .select('*');
    
    if (medicosError) {
      console.error('❌ Erro ao buscar médicos:', medicosError.message);
    } else {
      console.log(`📊 Total de médicos na tabela: ${medicos?.length || 0}`);
      if (medicos && medicos.length > 0) {
        console.log('📋 Primeiros médicos encontrados:');
        medicos.slice(0, 3).forEach((medico, index) => {
          console.log(`   ${index + 1}. ID: ${medico.id}`);
          console.log(`      CRM: ${medico.crm}`);
          console.log(`      Especialidades: ${JSON.stringify(medico.especialidades)}`);
          console.log(`      Verificação: ${JSON.stringify(medico.verificacao)}`);
          console.log('');
        });
      }
    }

    // 3. Verificar locais de atendimento
    console.log('3️⃣ Verificando locais de atendimento...');
    const { data: locais, error: locaisError } = await supabase
      .from('locais_atendimento')
      .select('*');
    
    if (locaisError) {
      console.error('❌ Erro ao buscar locais:', locaisError.message);
    } else {
      console.log(`📊 Total de locais de atendimento: ${locais?.length || 0}`);
      if (locais && locais.length > 0) {
        console.log('📋 Primeiros locais encontrados:');
        locais.slice(0, 3).forEach((local, index) => {
          console.log(`   ${index + 1}. ${local.nome_local}`);
          console.log(`      Cidade: ${local.cidade}/${local.estado}`);
          console.log(`      Ativo: ${local.is_active}`);
          console.log(`      Médico ID: ${local.medico_id}`);
          console.log('');
        });
      }
    }

    // 4. Testar função get_specialties
    console.log('4️⃣ Testando função get_specialties...');
    const { data: especialidades, error: especialidadesError } = await supabase
      .rpc('get_specialties');
    
    if (especialidadesError) {
      console.error('❌ Erro na função get_specialties:', especialidadesError.message);
    } else {
      console.log(`✅ Especialidades encontradas: ${especialidades?.length || 0}`);
      console.log(`📋 Lista: ${JSON.stringify(especialidades)}\n`);
    }

    // 5. Testar função get_available_states
    console.log('5️⃣ Testando função get_available_states...');
    const { data: estados, error: estadosError } = await supabase
      .rpc('get_available_states');
    
    if (estadosError) {
      console.error('❌ Erro na função get_available_states:', estadosError.message);
    } else {
      console.log(`✅ Estados encontrados: ${estados?.length || 0}`);
      console.log(`📋 Lista: ${JSON.stringify(estados)}\n`);
    }

    // 6. Testar função get_available_cities para DF
    console.log('6️⃣ Testando função get_available_cities para DF...');
    const { data: cidades, error: cidadesError } = await supabase
      .rpc('get_available_cities', { state_uf: 'DF' });
    
    if (cidadesError) {
      console.error('❌ Erro na função get_available_cities:', cidadesError.message);
    } else {
      console.log(`✅ Cidades em DF: ${cidades?.length || 0}`);
      console.log(`📋 Lista: ${JSON.stringify(cidades)}\n`);
    }

    // 7. Testar função get_doctors_by_location_and_specialty
    console.log('7️⃣ Testando função get_doctors_by_location_and_specialty...');
    
    // Primeiro, vamos usar dados que sabemos que existem
    if (especialidades && especialidades.length > 0 && estados && estados.length > 0 && cidades && cidades.length > 0) {
      const testeEspecialidade = especialidades[0];
      const testeEstado = estados[0]?.uf || 'DF';
      const testeCidade = cidades[0]?.cidade || 'Brasília';
      
      console.log(`🔍 Testando com: ${testeEspecialidade} em ${testeCidade}/${testeEstado}`);
      
      const { data: medicosResult, error: medicosResultError } = await supabase
        .rpc('get_doctors_by_location_and_specialty', {
          p_specialty: testeEspecialidade,
          p_city: testeCidade,
          p_state: testeEstado
        });
      
      if (medicosResultError) {
        console.error('❌ Erro na função get_doctors_by_location_and_specialty:', medicosResultError.message);
      } else {
        console.log(`✅ Médicos encontrados: ${medicosResult?.length || 0}`);
        if (medicosResult && medicosResult.length > 0) {
          console.log('📋 Médicos retornados:');
          medicosResult.forEach((medico, index) => {
            console.log(`   ${index + 1}. ${medico.display_name}`);
            console.log(`      ID: ${medico.id}`);
            console.log(`      CRM: ${medico.crm}`);
            console.log(`      Especialidades: ${JSON.stringify(medico.especialidades)}`);
            console.log(`      Local: ${medico.local_nome}`);
            console.log('');
          });
        } else {
          console.log('⚠️ Nenhum médico retornado pela função RPC');
        }
      }
    } else {
      console.log('⚠️ Não foi possível testar a função - dados básicos não encontrados');
    }

    // 8. Verificar profiles dos médicos
    console.log('8️⃣ Verificando profiles dos médicos...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'medico');
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError.message);
    } else {
      console.log(`📊 Profiles de médicos: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('📋 Primeiros profiles:');
        profiles.slice(0, 3).forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.display_name || profile.full_name}`);
          console.log(`      ID: ${profile.id}`);
          console.log(`      Tipo: ${profile.user_type}`);
          console.log('');
        });
      }
    }

    // 9. Diagnóstico final
    console.log('🎯 DIAGNÓSTICO FINAL');
    console.log('===================');
    
    const temMedicos = medicos && medicos.length > 0;
    const temLocais = locais && locais.length > 0;
    const temEspecialidades = especialidades && especialidades.length > 0;
    const temEstados = estados && estados.length > 0;
    const temCidades = cidades && cidades.length > 0;
    const temProfiles = profiles && profiles.length > 0;
    
    if (!temMedicos) {
      console.log('❌ PROBLEMA: Não há médicos cadastrados na tabela medicos');
    }
    
    if (!temLocais) {
      console.log('❌ PROBLEMA: Não há locais de atendimento cadastrados');
    }
    
    if (!temEspecialidades) {
      console.log('❌ PROBLEMA: Função get_specialties não retorna dados');
    }
    
    if (!temEstados) {
      console.log('❌ PROBLEMA: Função get_available_states não retorna dados');
    }
    
    if (!temCidades) {
      console.log('❌ PROBLEMA: Função get_available_cities não retorna dados');
    }
    
    if (!temProfiles) {
      console.log('❌ PROBLEMA: Não há profiles de médicos cadastrados');
    }
    
    if (temMedicos && temLocais && temEspecialidades && temEstados && temCidades && temProfiles) {
      console.log('✅ Todos os dados básicos estão presentes');
      console.log('🔍 O problema pode estar na lógica de filtros ou RLS policies');
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar debug
debugStep4().then(() => {
  console.log('\n🏁 Debug concluído');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});