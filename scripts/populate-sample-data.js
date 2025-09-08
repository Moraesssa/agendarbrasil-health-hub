/**
 * Script para popular o banco com dados de exemplo funcionais
 * Execute: node scripts/populate-sample-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ulebotjrsgheybhpdnxd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateSampleData() {
  console.log('🚀 Populando banco com dados funcionais...');

  try {
    // 1. Criar médicos de exemplo
    console.log('📋 Criando médicos...');
    
    const medicos = [
      {
        id: 'dr-carlos-silva',
        nome: 'Dr. Carlos Silva',
        especialidade: 'Cardiologia',
        crm: '123456',
        uf_crm: 'SP',
        email: 'carlos.silva@exemplo.com',
        telefone: '(11) 99999-1111',
        bio_perfil: 'Cardiologista com 15 anos de experiência em prevenção e tratamento de doenças cardiovasculares.',
        valor_consulta_presencial: 200.00,
        valor_consulta_teleconsulta: 150.00,
        duracao_consulta_padrao: 30,
        duracao_consulta_inicial: 45,
        duracao_teleconsulta: 25,
        aceita_teleconsulta: true,
        aceita_consulta_presencial: true,
        rating: 4.8,
        total_avaliacoes: 127,
        ativo: true
      },
      {
        id: 'dra-ana-santos',
        nome: 'Dra. Ana Santos',
        especialidade: 'Pediatria',
        crm: '234567',
        uf_crm: 'RJ',
        email: 'ana.santos@exemplo.com',
        telefone: '(21) 99999-2222',
        bio_perfil: 'Pediatra especializada em desenvolvimento infantil e medicina preventiva.',
        valor_consulta_presencial: 180.00,
        valor_consulta_teleconsulta: 130.00,
        duracao_consulta_padrao: 25,
        duracao_consulta_inicial: 40,
        duracao_teleconsulta: 20,
        aceita_teleconsulta: true,
        aceita_consulta_presencial: true,
        rating: 4.9,
        total_avaliacoes: 89,
        ativo: true
      },
      {
        id: 'dr-roberto-lima',
        nome: 'Dr. Roberto Lima',
        especialidade: 'Clínica Geral',
        crm: '345678',
        uf_crm: 'MG',
        email: 'roberto.lima@exemplo.com',
        telefone: '(31) 99999-3333',
        bio_perfil: 'Clínico geral com foco em medicina preventiva e cuidados primários.',
        valor_consulta_presencial: 150.00,
        valor_consulta_teleconsulta: 120.00,
        duracao_consulta_padrao: 30,
        duracao_consulta_inicial: 45,
        duracao_teleconsulta: 25,
        aceita_teleconsulta: true,
        aceita_consulta_presencial: true,
        rating: 4.7,
        total_avaliacoes: 156,
        ativo: true
      },
      {
        id: 'dra-maria-oliveira',
        nome: 'Dra. Maria Oliveira',
        especialidade: 'Ginecologia',
        crm: '456789',
        uf_crm: 'SP',
        email: 'maria.oliveira@exemplo.com',
        telefone: '(11) 99999-4444',
        bio_perfil: 'Ginecologista com especialização em saúde da mulher e medicina reprodutiva.',
        valor_consulta_presencial: 220.00,
        valor_consulta_teleconsulta: 170.00,
        duracao_consulta_padrao: 35,
        duracao_consulta_inicial: 50,
        duracao_teleconsulta: 30,
        aceita_teleconsulta: true,
        aceita_consulta_presencial: true,
        rating: 4.9,
        total_avaliacoes: 203,
        ativo: true
      },
      {
        id: 'dr-paulo-costa',
        nome: 'Dr. Paulo Costa',
        especialidade: 'Dermatologia',
        crm: '567890',
        uf_crm: 'RJ',
        email: 'paulo.costa@exemplo.com',
        telefone: '(21) 99999-5555',
        bio_perfil: 'Dermatologista especializado em dermatologia clínica e estética.',
        valor_consulta_presencial: 190.00,
        valor_consulta_teleconsulta: 140.00,
        duracao_consulta_padrao: 25,
        duracao_consulta_inicial: 40,
        duracao_teleconsulta: 20,
        aceita_teleconsulta: true,
        aceita_consulta_presencial: true,
        rating: 4.6,
        total_avaliacoes: 78,
        ativo: true
      }
    ];

    const { error: medicosError } = await supabase
      .from('medicos')
      .upsert(medicos);

    if (medicosError) {
      console.error('Erro ao inserir médicos:', medicosError);
      return;
    }

    // 2. Criar locais de atendimento
    console.log('🏥 Criando locais de atendimento...');
    
    const locais = [
      {
        id: 'local-sp-centro',
        medico_id: 'dr-carlos-silva',
        nome: 'Clínica Cardio Center',
        endereco: 'Rua Augusta, 1000 - Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01305-000',
        telefone: '(11) 3333-1111',
        ativo: true
      },
      {
        id: 'local-sp-vila-madalena',
        medico_id: 'dr-carlos-silva',
        nome: 'Consultório Vila Madalena',
        endereco: 'Rua Harmonia, 500 - Vila Madalena',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '05435-000',
        telefone: '(11) 3333-2222',
        ativo: true
      },
      {
        id: 'local-rj-copacabana',
        medico_id: 'dra-ana-santos',
        nome: 'Pediatria Copacabana',
        endereco: 'Av. Atlântica, 2000 - Copacabana',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        cep: '22021-000',
        telefone: '(21) 3333-3333',
        ativo: true
      },
      {
        id: 'local-mg-savassi',
        medico_id: 'dr-roberto-lima',
        nome: 'Clínica Savassi',
        endereco: 'Rua Pernambuco, 800 - Savassi',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        cep: '30112-000',
        telefone: '(31) 3333-4444',
        ativo: true
      },
      {
        id: 'local-sp-jardins',
        medico_id: 'dra-maria-oliveira',
        nome: 'Gineco Jardins',
        endereco: 'Rua Oscar Freire, 1200 - Jardins',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01426-000',
        telefone: '(11) 3333-5555',
        ativo: true
      },
      {
        id: 'local-rj-ipanema',
        medico_id: 'dr-paulo-costa',
        nome: 'Derma Ipanema',
        endereco: 'Rua Visconde de Pirajá, 300 - Ipanema',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        cep: '22410-000',
        telefone: '(21) 3333-6666',
        ativo: true
      }
    ];

    const { error: locaisError } = await supabase
      .from('locais_atendimento')
      .upsert(locais);

    if (locaisError) {
      console.error('Erro ao inserir locais:', locaisError);
      return;
    }

    // 3. Criar horários de disponibilidade
    console.log('⏰ Criando horários de disponibilidade...');
    
    const horarios = [];
    
    // Para cada médico, criar horários de segunda a sexta
    for (const medico of medicos) {
      const localMedico = locais.find(l => l.medico_id === medico.id);
      
      // Segunda a sexta (1-5)
      for (let dia = 1; dia <= 5; dia++) {
        // Manhã: 8h às 12h
        horarios.push({
          medico_id: medico.id,
          local_id: localMedico?.id,
          dia_semana: dia,
          hora_inicio: '08:00',
          hora_fim: '12:00',
          tipo_consulta: 'presencial',
          intervalo_consultas: 30,
          ativo: true
        });

        // Tarde: 14h às 18h
        horarios.push({
          medico_id: medico.id,
          local_id: localMedico?.id,
          dia_semana: dia,
          hora_inicio: '14:00',
          hora_fim: '18:00',
          tipo_consulta: 'presencial',
          intervalo_consultas: 30,
          ativo: true
        });

        // Teleconsultas: 19h às 21h
        if (medico.aceita_teleconsulta) {
          horarios.push({
            medico_id: medico.id,
            local_id: null,
            dia_semana: dia,
            hora_inicio: '19:00',
            hora_fim: '21:00',
            tipo_consulta: 'teleconsulta',
            intervalo_consultas: 25,
            ativo: true
          });
        }
      }

      // Sábado manhã para alguns médicos
      if (medico.id === 'dr-carlos-silva' || medico.id === 'dr-roberto-lima') {
        horarios.push({
          medico_id: medico.id,
          local_id: localMedico?.id,
          dia_semana: 6,
          hora_inicio: '08:00',
          hora_fim: '12:00',
          tipo_consulta: 'presencial',
          intervalo_consultas: 30,
          ativo: true
        });
      }
    }

    const { error: horariosError } = await supabase
      .from('horarios_disponibilidade')
      .upsert(horarios);

    if (horariosError) {
      console.error('Erro ao inserir horários:', horariosError);
      return;
    }

    // 4. Criar algumas consultas de exemplo (histórico)
    console.log('📅 Criando consultas de exemplo...');
    
    const consultas = [
      {
        medico_id: 'dr-carlos-silva',
        paciente_id: 'paciente-exemplo-1',
        data_hora_agendada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
        duracao_estimada: 30,
        tipo: 'presencial',
        local_id: 'local-sp-centro',
        valor_consulta: 200.00,
        status: 'agendada',
        observacoes_paciente: 'Consulta de rotina',
        agendado_por: 'paciente-exemplo-1'
      },
      {
        medico_id: 'dra-ana-santos',
        paciente_id: 'paciente-exemplo-2',
        data_hora_agendada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Depois de amanhã
        duracao_estimada: 25,
        tipo: 'teleconsulta',
        valor_consulta: 130.00,
        status: 'agendada',
        observacoes_paciente: 'Acompanhamento pediátrico',
        agendado_por: 'paciente-exemplo-2'
      }
    ];

    const { error: consultasError } = await supabase
      .from('consultas')
      .upsert(consultas);

    if (consultasError) {
      console.error('Erro ao inserir consultas:', consultasError);
      return;
    }

    console.log('✅ Dados de exemplo criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- ${medicos.length} médicos criados`);
    console.log(`- ${locais.length} locais de atendimento`);
    console.log(`- ${horarios.length} horários de disponibilidade`);
    console.log(`- ${consultas.length} consultas de exemplo`);
    
    console.log('\n🎯 Agora você pode testar o sistema de agendamento em /agendamento');

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateSampleData().then(() => {
    console.log('🏁 Script finalizado');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { populateSampleData };