// Script para testar a geração de horários
console.log('🔍 Testando geração de horários...');

// Simular dados de teste
const testConfig = {
  duracaoConsulta: 30,
  horarioAtendimento: {
    segunda: [
      { inicio: '08:00', fim: '12:00', ativo: true },
      { inicio: '14:00', fim: '18:00', ativo: true }
    ],
    terca: [
      { inicio: '08:00', fim: '12:00', ativo: true },
      { inicio: '14:00', fim: '18:00', ativo: true }
    ]
  }
};

// Função para converter tempo em minutos
const timeToMinutes = (time) => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};

// Função para converter minutos em tempo
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Função para obter nome do dia
const getDayName = (date) => {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[date.getUTCDay()];
};

// Função para gerar slots de tempo
const generateTimeSlots = (config, selectedDate, existingAppointments = []) => {
  const dayName = getDayName(selectedDate);
  const workingHoursBlocks = config.horarioAtendimento?.[dayName] || [];

  console.log(`📅 Dia: ${dayName}`);
  console.log(`⏰ Blocos de horário: ${workingHoursBlocks.length}`);
  
  if (!workingHoursBlocks.length) {
    console.log('❌ Nenhum bloco de horário encontrado');
    return [];
  }

  const consultationDuration = config.duracaoConsulta || 30;
  const slots = [];

  for (const workingHours of workingHoursBlocks) {
    if (!workingHours.ativo) continue;

    const startMinutes = timeToMinutes(workingHours.inicio);
    const endMinutes = timeToMinutes(workingHours.fim);

    console.log(`🕐 Bloco: ${workingHours.inicio} - ${workingHours.fim} (${startMinutes} - ${endMinutes} min)`);

    for (let minutes = startMinutes; (minutes + consultationDuration) <= endMinutes; minutes += consultationDuration) {
      slots.push({
        time: minutesToTime(minutes),
        available: true
      });
    }
  }

  console.log(`✅ Slots gerados: ${slots.length}`);
  console.log('📋 Primeiros 5 slots:', slots.slice(0, 5));
  
  return slots;
};

// Testar para segunda-feira
const testDate = new Date('2025-01-27T00:00:00'); // Segunda-feira
console.log('\n🧪 Teste 1: Segunda-feira');
const slots1 = generateTimeSlots(testConfig, testDate);

// Testar para domingo (sem configuração)
const testDate2 = new Date('2025-01-26T00:00:00'); // Domingo
console.log('\n🧪 Teste 2: Domingo');
const slots2 = generateTimeSlots(testConfig, testDate2);

console.log('\n✅ Teste concluído!');