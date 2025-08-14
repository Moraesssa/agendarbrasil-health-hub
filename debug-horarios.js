// Script de debug para testar o problema dos horários
// Execute: node debug-horarios.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Utility functions for better error handling and logging
const logStep = (step, message) => console.log(`${step} ${message}`);
const logError = (message, error) => {
  console.error(`❌ ${message}:`, error?.message || error);
  if (error?.details) console.error('Detalhes:', error.details);
};
const logSuccess = (message, data) => console.log(`✅ ${message}`, data);

// Authentication check
async function checkAuthentication() {
  logStep('1️⃣', 'Testando autenticação...');
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    logError('Erro de autenticação', authError);
    return null;
  }
  
  if (!user) {
    console.log('⚠️ Usuário não autenticado');
    return null;
  }
  
  logSuccess('Usuário autenticado:', user.id);
  return user;
}

// Doctor data retrieval
async function getMedicoData() {
  logStep('2️⃣', 'Testando busca de médicos...');
  
  const { data: medicos, error: medicosError } = await supabase
    .from('medicos')
    .select('user_id, configuracoes')
    .limit(1);

  if (medicosError) {
    logError('Erro ao buscar médicos', medicosError);
    return null;
  }

  if (!medicos || medicos.length === 0) {
    console.log('⚠️ Nenhum médico encontrado');
    return null;
  }

  const medico = medicos[0];
  logSuccess('Médico encontrado:', medico.user_id);
  console.log('Configurações:', JSON.stringify(medico.configuracoes, null, 2));
  return medico;
}

// Location data retrieval
async function getLocaisAtendimento(medicoId) {
  logStep('3️⃣', 'Testando busca de locais de atendimento...');
  
  const { data: locais, error: locaisError } = await supabase
    .from('locais_atendimento')
    .select('*')
    .eq('medico_id', medicoId);

  if (locaisError) {
    logError('Erro ao buscar locais', locaisError);
    return null;
  }

  logSuccess('Locais encontrados:', locais?.length || 0);
  
  if (locais && locais.length > 0) {
    locais.forEach((local, index) => {
      console.log(`📍 Local ${index + 1}:`, {
        id: local.id,
        nome: local.nome,
        endereco: local.endereco,
        ativo: local.ativo
      });
    });
  }
  
  return locais;
}

// Schedule data retrieval and analysis
async function checkHorariosData(medicoId) {
  logStep('4️⃣', 'Testando dados de horários...');
  
  const { data: horarios, error: horariosError } = await supabase
    .from('horarios_agendamento')
    .select('*')
    .eq('medico_id', medicoId)
    .limit(10);

  if (horariosError) {
    logError('Erro ao buscar horários', horariosError);
    return null;
  }

  logSuccess('Horários encontrados:', horarios?.length || 0);
  
  if (horarios && horarios.length > 0) {
    console.log('📅 Primeiros horários:');
    horarios.forEach((horario, index) => {
      console.log(`  ${index + 1}. ${horario.data_hora} - Status: ${horario.status}`);
    });
  }
  
  return horarios;
}

// Appointment data analysis
async function checkAgendamentosData(medicoId) {
  logStep('5️⃣', 'Testando dados de agendamentos...');
  
  const { data: agendamentos, error: agendamentosError } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('medico_id', medicoId)
    .limit(5);

  if (agendamentosError) {
    logError('Erro ao buscar agendamentos', agendamentosError);
    return null;
  }

  logSuccess('Agendamentos encontrados:', agendamentos?.length || 0);
  
  if (agendamentos && agendamentos.length > 0) {
    console.log('📋 Agendamentos recentes:');
    agendamentos.forEach((agendamento, index) => {
      console.log(`  ${index + 1}. ${agendamento.data_hora} - Paciente: ${agendamento.paciente_nome} - Status: ${agendamento.status}`);
    });
  }
  
  return agendamentos;
}

// Main debug function
async function debugHorarios() {
  console.log('🔍 Iniciando debug dos horários...\n');

  try {
    // Check authentication
    const user = await checkAuthentication();
    if (!user) return;

    // Get doctor data
    const medico = await getMedicoData();
    if (!medico) return;

    // Get locations
    const locais = await getLocaisAtendimento(medico.user_id);
    
    // Check schedule data
    const horarios = await checkHorariosData(medico.user_id);
    
    // Check appointments data
    const agendamentos = await checkAgendamentosData(medico.user_id);
    
    // Summary
    console.log('\n📊 Resumo do Debug:');
    console.log(`- Usuário: ${user.id}`);
    console.log(`- Médico: ${medico.user_id}`);
    console.log(`- Locais: ${locais?.length || 0}`);
    console.log(`- Horários: ${horarios?.length || 0}`);
    console.log(`- Agendamentos: ${agendamentos?.length || 0}`);
    
  } catch (error) {
    logError('Erro geral no debug', error);
  }
}

// Execute if run directly
if (require.main === module) {
  debugHorarios();
}

module.exports = { 
  debugHorarios, 
  checkAuthentication, 
  getMedicoData, 
  getLocaisAtendimento,
  checkHorariosData,
  checkAgendamentosData 
};