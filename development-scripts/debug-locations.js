import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ulebotjrsgheybhpdnxd.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugLocations() {
  console.log("🔍 Verificando localizações dos médicos...\n");

  try {
    // Buscar todos os locais de atendimento
    const { data: locais, error } = await supabase
      .from('locais_atendimento')
      .select('*');

    if (error) {
      console.error("❌ Erro ao buscar locais:", error);
      return;
    }

    console.log(`✅ Encontrados ${locais.length} locais de atendimento\n`);

    for (const local of locais) {
      // Buscar dados do médico
      const { data: medico } = await supabase
        .from('medicos')
        .select('especialidades')
        .eq('user_id', local.medico_id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', local.medico_id)
        .single();

      console.log(`🏥 Local: ${local.nome_local}`);
      console.log(`   Médico: ${profile?.display_name || 'Nome não encontrado'}`);
      console.log(`   Especialidades: ${medico?.especialidades?.join(', ') || 'Nenhuma'}`);
      console.log(`   Ativo: ${local.ativo ? 'Sim' : 'Não'}`);
      console.log(`   Endereço:`, JSON.stringify(local.endereco, null, 2));
      console.log("");
    }

    // Testar função específica com dados reais
    console.log("🔍 Testando função get_doctors_by_location_and_specialty...\n");
    
    // Primeiro, vamos ver quais cidades/estados existem
    const uniqueLocations = [...new Set(locais.map(l => `${l.endereco?.cidade || 'N/A'}, ${l.endereco?.uf || 'N/A'}`))];
    console.log("📍 Localizações únicas encontradas:");
    uniqueLocations.forEach(loc => console.log(`   - ${loc}`));
    console.log("");

    // Testar com uma localização real
    if (locais.length > 0) {
      const firstLocal = locais[0];
      const cidade = firstLocal.endereco?.cidade;
      const uf = firstLocal.endereco?.uf;
      
      if (cidade && uf) {
        // Buscar médico deste local
        const { data: medicoLocal } = await supabase
          .from('medicos')
          .select('especialidades')
          .eq('user_id', firstLocal.medico_id)
          .single();

        if (medicoLocal?.especialidades && medicoLocal.especialidades.length > 0) {
          const especialidade = medicoLocal.especialidades[0];
          
          console.log(`🔍 Testando busca: ${especialidade} em ${cidade}/${uf}`);
          
          const { data: result, error: searchError } = await supabase.rpc('get_doctors_by_location_and_specialty', {
            p_specialty: especialidade,
            p_city: cidade,
            p_state: uf
          });

          if (searchError) {
            console.error("❌ Erro na busca:", searchError);
          } else {
            console.log(`✅ Resultado: ${result?.length || 0} médico(s) encontrado(s)`);
            if (result && result.length > 0) {
              result.forEach(doc => {
                console.log(`   - ${doc.display_name} (ID: ${doc.id})`);
              });
            }
          }
        }
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

debugLocations();