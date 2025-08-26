#!/usr/bin/env node

/**
 * Script para testar se as correções do Step 4 funcionaram
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🧪 TESTE: Verificando correções do Step 4');
console.log('==========================================\n');

async function testStep4Fix() {
  try {
    // 1. Testar get_available_cities para DF
    console.log('1️⃣ Testando get_available_cities para DF...');
    const { data: cidades, error: cidadesError } = await supabase
      .rpc('get_available_cities', { state_uf: 'DF' });
    
    if (cidadesError) {
      console.error('❌ Erro:', cidadesError.message);
    } else {
      console.log(`✅ Cidades em DF: ${cidades?.length || 0}`);
      if (cidades && cidades.length > 0) {
        console.log(`📋 Cidades: ${cidades.map(c => c.cidade).join(', ')}`);
      }
    }

    // 2. Testar get_doctors_by_location_and_specialty
    console.log('\n2️⃣ Testando busca de médicos...');
    
    if (cidades && cidades.length > 0) {
      const { data: medicos, error: medicosError } = await supabase
        .rpc('get_doctors_by_location_and_specialty', {
          p_specialty: 'Cardiologia',
          p_city: 'Brasília',
          p_state: 'DF'
        });
      
      if (medicosError) {
        console.error('❌ Erro:', medicosError.message);
      } else {
        console.log(`✅ Médicos encontrados: ${medicos?.length || 0}`);
        if (medicos && medicos.length > 0) {
          medicos.forEach((medico, index) => {
            console.log(`   ${index + 1}. ${medico.display_name}`);
            console.log(`      CRM: ${medico.crm}`);
            console.log(`      Local: ${medico.local_nome}`);
          });
        }
      }
    }

    // 3. Verificar profiles de médicos
    console.log('\n3️⃣ Verificando profiles de médicos...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'medico');
    
    if (profilesError) {
      console.error('❌ Erro:', profilesError.message);
    } else {
      console.log(`✅ Profiles de médicos: ${profiles?.length || 0}`);
    }

    // 4. Verificar locais ativos
    console.log('\n4️⃣ Verificando locais ativos...');
    const { data: locais, error: locaisError } = await supabase
      .from('locais_atendimento')
      .select('*')
      .eq('is_active', true);
    
    if (locaisError) {
      console.error('❌ Erro:', locaisError.message);
    } else {
      console.log(`✅ Locais ativos: ${locais?.length || 0}`);
      const locaisDF = locais?.filter(l => l.estado === 'DF') || [];
      console.log(`📍 Locais em DF: ${locaisDF.length}`);
    }

    // 5. Resultado final
    console.log('\n🎯 RESULTADO FINAL');
    console.log('==================');
    
    const temCidadesDF = cidades && cidades.length > 0;
    const temProfiles = profiles && profiles.length > 0;
    const temLocaisAtivos = locais && locais.length > 0;
    
    if (temCidadesDF && temProfiles && temLocaisAtivos) {
      console.log('✅ SUCESSO: Todas as correções foram aplicadas!');
      console.log('🚀 O Step 4 agora deve funcionar corretamente');
    } else {
      console.log('⚠️ ATENÇÃO: Algumas correções podem não ter sido aplicadas completamente');
      if (!temCidadesDF) console.log('   - Não há cidades em DF');
      if (!temProfiles) console.log('   - Não há profiles de médicos');
      if (!temLocaisAtivos) console.log('   - Não há locais ativos');
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

testStep4Fix().then(() => {
  console.log('\n🏁 Teste concluído');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});