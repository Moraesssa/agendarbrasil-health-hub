import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ulebotjrsgheybhpdnxd.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugDoctorConfigurations() {
  console.log("🔍 Verificando configurações dos médicos...\n");

  try {
    // Buscar todos os médicos com suas configurações
    const { data: medicos, error } = await supabase
      .from('medicos')
      .select(`
        user_id,
        especialidades,
        configuracoes
      `);

    if (error) {
      console.error("❌ Erro ao buscar médicos:", error);
      return;
    }

    console.log(`✅ Encontrados ${medicos.length} médicos\n`);

    for (const medico of medicos) {
      // Buscar profile do médico
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', medico.user_id)
        .single();

      // Buscar locais do médico
      const { data: locais } = await supabase
        .from('locais_atendimento')
        .select('id, nome_local, ativo')
        .eq('medico_id', medico.user_id);

      console.log(`👨‍⚕️ Médico: ${profile?.display_name || 'Nome não encontrado'}`);
      console.log(`   ID: ${medico.user_id}`);
      console.log(`   Especialidades: ${medico.especialidades?.join(', ') || 'Nenhuma'}`);
      console.log(`   Locais ativos: ${locais?.filter(l => l.ativo).length || 0}`);
      
      if (medico.configuracoes?.horarioAtendimento) {
        console.log("   📅 Horários de atendimento:");
        const horarios = medico.configuracoes.horarioAtendimento;
        
        for (const [dia, blocos] of Object.entries(horarios)) {
          if (Array.isArray(blocos) && blocos.length > 0) {
            const blocosAtivos = blocos.filter(b => b.ativo);
            if (blocosAtivos.length > 0) {
              console.log(`      ${dia}: ${blocosAtivos.length} bloco(s) ativo(s)`);
              blocosAtivos.forEach((bloco, index) => {
                console.log(`        ${index + 1}. ${bloco.inicio} - ${bloco.fim}${bloco.inicioAlmoco ? ` (almoço: ${bloco.inicioAlmoco}-${bloco.fimAlmoco})` : ''}`);
              });
            }
          }
        }
      } else {
        console.log("   ❌ Sem configuração de horários");
      }
      
      console.log(""); // Linha em branco
    }

    // Testar busca específica por especialidade e localização
    console.log("\n🔍 Testando busca por médicos em São Paulo com Cardiologia...");
    
    const { data: doctorsInSP, error: spError } = await supabase.rpc('get_doctors_by_location_and_specialty', {
      p_specialty: 'Cardiologia',
      p_city: 'São Paulo',
      p_state: 'SP'
    });

    if (spError) {
      console.error("❌ Erro na busca:", spError);
    } else {
      console.log(`✅ Médicos encontrados em SP: ${doctorsInSP?.length || 0}`);
      if (doctorsInSP && doctorsInSP.length > 0) {
        doctorsInSP.forEach(doc => {
          console.log(`   - ${doc.display_name} (ID: ${doc.id})`);
        });
      }
    }

    // Testar busca em Brasília
    console.log("\n🔍 Testando busca por médicos em Brasília com Pediatria...");
    
    const { data: doctorsInBSB, error: bsbError } = await supabase.rpc('get_doctors_by_location_and_specialty', {
      p_specialty: 'Pediatria',
      p_city: 'Brasília',
      p_state: 'DF'
    });

    if (bsbError) {
      console.error("❌ Erro na busca:", bsbError);
    } else {
      console.log(`✅ Médicos encontrados em Brasília: ${doctorsInBSB?.length || 0}`);
      if (doctorsInBSB && doctorsInBSB.length > 0) {
        doctorsInBSB.forEach(doc => {
          console.log(`   - ${doc.display_name} (ID: ${doc.id})`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

debugDoctorConfigurations();