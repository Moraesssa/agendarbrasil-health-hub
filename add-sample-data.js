import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ulebotjrsgheybhpdnxd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU'
);

async function addSampleData() {
  try {
    console.log('🚀 Adicionando dados de exemplo...');
    
    // 1. Buscar médicos existentes
    const { data: medicos } = await supabase
      .from('medicos')
      .select('id, nome');
    
    console.log('Médicos encontrados:', medicos);
    
    if (!medicos || medicos.length === 0) {
      console.log('❌ Nenhum médico encontrado');
      return;
    }
    
    // 2. Adicionar locais de atendimento
    for (const medico of medicos) {
      const { error: localError } = await supabase
        .from('locais_atendimento')
        .insert([{
          medico_id: medico.id,
          nome: `Clínica ${medico.nome.split(' ')[1] || 'Médica'}`,
          endereco: 'Rua das Flores, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          telefone: '(11) 99999-0000',
          ativo: true
        }]);
      
      if (localError) {
        console.error('Erro ao criar local:', localError);
      } else {
        console.log(`✅ Local criado para ${medico.nome}`);
      }
    }
    
    // 3. Buscar locais criados
    const { data: locais } = await supabase
      .from('locais_atendimento')
      .select('id, medico_id');
    
    // 4. Adicionar horários de disponibilidade
    for (const medico of medicos) {
      const local = locais?.find(l => l.medico_id === medico.id);
      
      // Horários presenciais (Segunda a Sexta, 8h às 17h)
      for (let dia = 1; dia <= 5; dia++) {
        const { error: horarioError } = await supabase
          .from('horarios_disponibilidade')
          .insert([{
            medico_id: medico.id,
            local_id: local?.id,
            dia_semana: dia,
            hora_inicio: '08:00',
            hora_fim: '17:00',
            tipo_consulta: 'presencial',
            intervalo_consultas: 30,
            ativo: true
          }]);
        
        if (horarioError) {
          console.error('Erro ao criar horário presencial:', horarioError);
        }
      }
      
      // Teleconsultas (Segunda a Sábado, 7h às 20h)
      for (let dia = 1; dia <= 6; dia++) {
        const { error: horarioError } = await supabase
          .from('horarios_disponibilidade')
          .insert([{
            medico_id: medico.id,
            local_id: null, // teleconsulta
            dia_semana: dia,
            hora_inicio: '07:00',
            hora_fim: '20:00',
            tipo_consulta: 'teleconsulta',
            intervalo_consultas: 30,
            ativo: true
          }]);
        
        if (horarioError) {
          console.error('Erro ao criar horário teleconsulta:', horarioError);
        }
      }
      
      console.log(`✅ Horários criados para ${medico.nome}`);
    }
    
    console.log('🎉 Dados de exemplo adicionados com sucesso!');
    
    // 5. Verificar dados criados
    const { data: horariosCount } = await supabase
      .from('horarios_disponibilidade')
      .select('id', { count: 'exact', head: true });
    
    const { data: locaisCount } = await supabase
      .from('locais_atendimento')
      .select('id', { count: 'exact', head: true });
    
    console.log(`📊 Resumo:`);
    console.log(`- Médicos: ${medicos.length}`);
    console.log(`- Locais: ${locaisCount || 0}`);
    console.log(`- Horários: ${horariosCount || 0}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addSampleData().catch(console.error);