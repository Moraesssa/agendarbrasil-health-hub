// Script para debugar problemas do Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ulebotjrsgheybhpdnxd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDM5MjUsImV4cCI6MjA2NjExOTkyNX0.1OVxsso5wSjnvOClf-i3DfsUUOKkpwkjioEndKB2ux4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugSupabase() {
  console.log("🔍 Iniciando debug do Supabase...");
  
  try {
    // 1. Testar get_specialties
    console.log("\n1. Testando get_specialties...");
    const { data: specialties, error: specialtiesError } = await supabase.rpc('get_specialties');
    if (specialtiesError) {
      console.error("❌ Erro em get_specialties:", specialtiesError);
    } else {
      console.log("✅ Especialidades encontradas:", specialties?.length || 0);
      console.log("Primeiras 5:", specialties?.slice(0, 5));
    }

    // 2. Testar get_available_states
    console.log("\n2. Testando get_available_states...");
    const { data: states, error: statesError } = await supabase.rpc('get_available_states');
    if (statesError) {
      console.error("❌ Erro em get_available_states:", statesError);
    } else {
      console.log("✅ Estados encontrados:", states?.length || 0);
      console.log("Estados:", states?.map(s => s.uf));
    }

    // 3. Testar get_available_cities (usando primeiro estado encontrado)
    if (states && states.length > 0) {
      const firstState = states[0].uf;
      console.log(`\n3. Testando get_available_cities para ${firstState}...`);
      const { data: cities, error: citiesError } = await supabase.rpc('get_available_cities', { 
        state_uf: firstState 
      });
      if (citiesError) {
        console.error("❌ Erro em get_available_cities:", citiesError);
      } else {
        console.log("✅ Cidades encontradas:", cities?.length || 0);
        console.log("Primeiras 3 cidades:", cities?.slice(0, 3)?.map(c => c.cidade));
      }

      // 4. Testar get_doctors_by_location_and_specialty
      if (cities && cities.length > 0 && specialties && specialties.length > 0) {
        const firstCity = cities[0].cidade;
        const firstSpecialty = specialties[0];
        console.log(`\n4. Testando get_doctors_by_location_and_specialty para ${firstSpecialty} em ${firstCity}/${firstState}...`);
        
        const { data: doctors, error: doctorsError } = await supabase.rpc('get_doctors_by_location_and_specialty', {
          p_specialty: firstSpecialty,
          p_city: firstCity,
          p_state: firstState
        });
        
        if (doctorsError) {
          console.error("❌ Erro em get_doctors_by_location_and_specialty:", doctorsError);
        } else {
          console.log("✅ Médicos encontrados:", doctors?.length || 0);
          console.log("Médicos:", doctors?.map(d => ({ id: d.id, name: d.display_name })));
        }
      }
    }

    // 5. Verificar dados das tabelas principais
    console.log("\n5. Verificando dados das tabelas...");
    
    // Contar profiles
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profilesError) {
      console.error("❌ Erro ao contar profiles:", profilesError);
    } else {
      console.log("✅ Total de profiles:", profilesCount);
    }

    // Contar médicos
    const { count: medicosCount, error: medicosError } = await supabase
      .from('medicos')
      .select('*', { count: 'exact', head: true });
    
    if (medicosError) {
      console.error("❌ Erro ao contar médicos:", medicosError);
    } else {
      console.log("✅ Total de médicos:", medicosCount);
    }

    // Contar locais de atendimento
    const { count: locaisCount, error: locaisError } = await supabase
      .from('locais_atendimento')
      .select('*', { count: 'exact', head: true });
    
    if (locaisError) {
      console.error("❌ Erro ao contar locais:", locaisError);
    } else {
      console.log("✅ Total de locais de atendimento:", locaisCount);
    }

    // 6. Verificar integridade referencial
    console.log("\n6. Verificando integridade referencial...");
    
    // Consultas com medico_id inválido
    const { data: invalidMedicos, error: invalidMedicosError } = await supabase
      .from('consultas')
      .select(`
        id,
        medico_id,
        profiles!consultas_medico_id_fkey(id)
      `)
      .is('profiles.id', null)
      .not('medico_id', 'is', null);
    
    if (invalidMedicosError) {
      console.error("❌ Erro ao verificar médicos inválidos:", invalidMedicosError);
    } else {
      console.log("⚠️ Consultas com medico_id inválido:", invalidMedicos?.length || 0);
    }

    console.log("\n🎉 Debug concluído!");

  } catch (error) {
    console.error("💥 Erro geral:", error);
  }
}

// Executar o debug
debugSupabase();