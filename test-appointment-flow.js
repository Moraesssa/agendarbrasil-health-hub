import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ulebotjrsgheybhpdnxd.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAppointmentFlow() {
  console.log("🔍 Testando fluxo completo de agendamento...\n");

  try {
    // 1. Testar especialidades
    console.log("1️⃣ Testando get_specialties...");
    const { data: specialties, error: specError } = await supabase.rpc('get_specialties');
    if (specError) {
      console.error("❌ Erro:", specError);
      return;
    }
    console.log(`✅ ${specialties?.length || 0} especialidades encontradas`);
    console.log(`   Primeira: ${specialties?.[0] || 'N/A'}\n`);

    // 2. Testar estados
    console.log("2️⃣ Testando get_available_states...");
    const { data: states, error: statesError } = await supabase.rpc('get_available_states');
    if (statesError) {
      console.error("❌ Erro:", statesError);
      return;
    }
    console.log(`✅ ${states?.length || 0} estados encontrados`);
    console.log(`   Primeiro: ${states?.[0]?.uf || 'N/A'}\n`);

    // 3. Testar cidades para o primeiro estado
    if (states && states.length > 0) {
      const firstState = states[0].uf;
      console.log(`3️⃣ Testando get_available_cities para ${firstState}...`);
      const { data: cities, error: citiesError } = await supabase.rpc('get_available_cities', { state_uf: firstState });
      if (citiesError) {
        console.error("❌ Erro:", citiesError);
        return;
      }
      console.log(`✅ ${cities?.length || 0} cidades encontradas`);
      console.log(`   Primeira: ${cities?.[0]?.cidade || 'N/A'}\n`);

      // 4. Testar médicos para primeira especialidade, cidade e estado
      if (cities && cities.length > 0 && specialties && specialties.length > 0) {
        const firstCity = cities[0].cidade;
        const firstSpecialty = specialties[0];
        
        console.log(`4️⃣ Testando get_doctors_by_location_and_specialty...`);
        console.log(`   Especialidade: ${firstSpecialty}`);
        console.log(`   Cidade: ${firstCity}`);
        console.log(`   Estado: ${firstState}`);
        
        const { data: doctors, error: doctorsError } = await supabase.rpc('get_doctors_by_location_and_specialty', {
          p_specialty: firstSpecialty,
          p_city: firstCity,
          p_state: firstState
        });
        
        if (doctorsError) {
          console.error("❌ Erro:", doctorsError);
          return;
        }
        
        console.log(`✅ ${doctors?.length || 0} médicos encontrados`);
        if (doctors && doctors.length > 0) {
          console.log(`   Primeiro: ${doctors[0].display_name} (ID: ${doctors[0].id})\n`);

          // 5. Testar horários disponíveis para o primeiro médico
          const firstDoctor = doctors[0];
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          const testDate = tomorrow.toISOString().split('T')[0];
          
          console.log(`5️⃣ Testando horários para médico ${firstDoctor.display_name}...`);
          console.log(`   Data de teste: ${testDate}`);
          
          // Buscar configurações do médico
          const { data: medicoConfig, error: configError } = await supabase
            .from('medicos')
            .select('configuracoes')
            .eq('user_id', firstDoctor.id)
            .single();
          
          if (configError) {
            console.error("❌ Erro ao buscar configurações:", configError);
            return;
          }
          
          console.log("📋 Configurações do médico:");
          console.log(JSON.stringify(medicoConfig.configuracoes, null, 2));
          
          // Buscar locais do médico
          const { data: locais, error: locaisError } = await supabase
            .from('locais_atendimento')
            .select('*')
            .eq('medico_id', firstDoctor.id);
          
          if (locaisError) {
            console.error("❌ Erro ao buscar locais:", locaisError);
            return;
          }
          
          console.log(`\n🏥 ${locais?.length || 0} locais encontrados para o médico:`);
          locais?.forEach((local, index) => {
            console.log(`   ${index + 1}. ${local.nome_local} (${local.ativo ? 'Ativo' : 'Inativo'})`);
            console.log(`      Endereço: ${local.endereco?.logradouro}, ${local.endereco?.numero} - ${local.endereco?.cidade}/${local.endereco?.uf}`);
          });
          
          // Verificar se há horários configurados para amanhã
          const horarioAtendimento = medicoConfig.configuracoes?.horarioAtendimento;
          if (horarioAtendimento) {
            const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
            const tomorrowDayName = dayNames[tomorrow.getDay()];
            const horariosAmanha = horarioAtendimento[tomorrowDayName];
            
            console.log(`\n📅 Horários configurados para ${tomorrowDayName}:`);
            if (Array.isArray(horariosAmanha) && horariosAmanha.length > 0) {
              horariosAmanha.forEach((bloco, index) => {
                console.log(`   ${index + 1}. ${bloco.inicio} - ${bloco.fim} (${bloco.ativo ? 'Ativo' : 'Inativo'})`);
                if (bloco.inicioAlmoco && bloco.fimAlmoco) {
                  console.log(`      Almoço: ${bloco.inicioAlmoco} - ${bloco.fimAlmoco}`);
                }
              });
            } else {
              console.log("   ❌ Nenhum horário configurado para este dia");
            }
          }
          
        } else {
          console.log("❌ Nenhum médico encontrado para esta combinação\n");
        }
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

testAppointmentFlow();