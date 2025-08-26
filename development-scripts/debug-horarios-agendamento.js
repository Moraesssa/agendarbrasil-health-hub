#!/usr/bin/env node

/**
 * Debug de Horários - AgendarBrasil Health Hub
 * 
 * Este script ajuda a debugar problemas com a geração de horários
 * na página de agendamento.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.magenta}▶${colors.reset} ${msg}`)
};

// Carregar variáveis de ambiente
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    log.error('Arquivo .env não encontrado!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

// Funções utilitárias de tempo (copiadas do timeSlotUtils.ts)
const timeToMinutes = (time) => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const getDayName = (date) => {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[date.getUTCDay()];
};

// Função para gerar horários (simplificada)
const generateTimeSlots = (doctorConfig, selectedDate, existingAppointments = []) => {
  const dayName = getDayName(selectedDate);
  const workingHoursBlocks = doctorConfig.horarioAtendimento?.[dayName] || [];

  console.log("🔧 generateTimeSlots - Entrada:", {
    dayName,
    workingHoursBlocksCount: workingHoursBlocks.length,
    workingHoursBlocks: JSON.stringify(workingHoursBlocks, null, 2),
    selectedDate: selectedDate.toISOString(),
    existingAppointmentsCount: existingAppointments.length
  });

  if (!workingHoursBlocks.length) {
    console.log("❌ generateTimeSlots - Nenhum bloco de horário encontrado para", dayName);
    return [];
  }

  const consultationDuration = doctorConfig.duracaoConsulta || 30;
  const bufferMinutes = doctorConfig.bufferMinutos || 0;
  const slotInterval = consultationDuration + bufferMinutes;

  const slots = [];

  // Processar cada bloco de horário
  for (const workingHours of workingHoursBlocks) {
    if (!workingHours.ativo) continue;

    const startMinutes = timeToMinutes(workingHours.inicio);
    const endMinutes = timeToMinutes(workingHours.fim);
    const lunchStartMinutes = workingHours.inicioAlmoco ? timeToMinutes(workingHours.inicioAlmoco) : null;
    const lunchEndMinutes = workingHours.fimAlmoco ? timeToMinutes(workingHours.fimAlmoco) : null;

    for (let minutes = startMinutes; (minutes + consultationDuration) <= endMinutes; minutes += slotInterval) {
      const slotStart = minutes;
      const slotEnd = slotStart + consultationDuration;

      // Pula os horários que caem dentro do intervalo de almoço
      if (lunchStartMinutes && lunchEndMinutes && slotStart < lunchEndMinutes && slotEnd > lunchStartMinutes) {
        continue;
      }

      slots.push({
        time: minutesToTime(minutes),
        available: true
      });
    }
  }

  console.log("✅ generateTimeSlots - Resultado:", {
    slotsCount: slots.length,
    sampleSlots: slots.slice(0, 5)
  });

  return slots;
};

async function debugHorarios() {
  log.title('🔍 Debug de Horários - AgendarBrasil Health Hub');
  
  const envVars = loadEnvVars();
  
  const supabaseUrl = envVars['VITE_SUPABASE_URL'];
  const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-') || supabaseKey.includes('your-')) {
    log.warning('Supabase não configurado - testando com dados mock');
    
    // Testar geração de horários com configuração mock
    const mockConfig = {
      duracaoConsulta: 30,
      horarioAtendimento: {
        segunda: [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
        terca: [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
        quarta: [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
        quinta: [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
        sexta: [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
        sabado: [{ inicio: '08:00', fim: '12:00', ativo: false }],
        domingo: [{ inicio: '08:00', fim: '12:00', ativo: false }]
      }
    };
    
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    log.step('Testando geração de horários para amanhã...');
    const horarios = generateTimeSlots(mockConfig, amanha);
    
    if (horarios.length > 0) {
      log.success(`${horarios.length} horários gerados com sucesso!`);
      console.log('Primeiros 10 horários:', horarios.slice(0, 10));
    } else {
      log.error('Nenhum horário foi gerado!');
    }
    
    return;
  }
  
  // Testar com Supabase real
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  log.step('Testando conexão com Supabase...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      log.warning('Usuário não autenticado - alguns testes podem falhar');
    } else {
      log.success('Usuário autenticado');
    }
    
    // Buscar médicos
    log.step('Buscando médicos...');
    const { data: medicos, error: medicosError } = await supabase
      .from('medicos')
      .select('user_id, configuracoes, locais:locais_atendimento(*)')
      .limit(5);
    
    if (medicosError) {
      log.error(`Erro ao buscar médicos: ${medicosError.message}`);
      return;
    }
    
    if (!medicos || medicos.length === 0) {
      log.warning('Nenhum médico encontrado no banco de dados');
      log.info('Isso pode explicar por que não há horários disponíveis');
      return;
    }
    
    log.success(`${medicos.length} médicos encontrados`);
    
    // Analisar configurações dos médicos
    for (const medico of medicos) {
      log.step(`Analisando médico: ${medico.user_id}`);
      
      console.log('Configurações:', JSON.stringify(medico.configuracoes, null, 2));
      console.log('Locais:', medico.locais?.length || 0);
      
      if (!medico.configuracoes) {
        log.warning('Médico sem configurações');
        continue;
      }
      
      const config = medico.configuracoes;
      if (!config.horarioAtendimento) {
        log.warning('Médico sem horários de atendimento configurados');
        continue;
      }
      
      // Testar geração de horários para este médico
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);
      
      const horarios = generateTimeSlots(config, amanha);
      
      if (horarios.length > 0) {
        log.success(`${horarios.length} horários gerados para este médico`);
        console.log('Primeiros 5 horários:', horarios.slice(0, 5));
      } else {
        log.warning('Nenhum horário gerado para este médico');
        
        // Debug detalhado
        const dayName = getDayName(amanha);
        const workingHours = config.horarioAtendimento[dayName];
        console.log(`Horários para ${dayName}:`, workingHours);
        
        if (!workingHours || workingHours.length === 0) {
          log.error(`Médico não atende em ${dayName}`);
        } else {
          const activeBlocks = workingHours.filter(block => block.ativo);
          if (activeBlocks.length === 0) {
            log.error(`Todos os blocos estão inativos para ${dayName}`);
          } else {
            log.info(`${activeBlocks.length} blocos ativos encontrados`);
            console.log('Blocos ativos:', activeBlocks);
          }
        }
      }
    }
    
  } catch (error) {
    log.error(`Erro durante o debug: ${error.message}`);
  }
}

debugHorarios().catch((error) => {
  log.error('Erro durante o debug:', error.message);
  process.exit(1);
});