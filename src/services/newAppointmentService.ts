
import { supabase } from '@/integrations/supabase/client';
import { 
  generateTimeSlots, 
  TimeSlot,
  ExistingAppointment,
  WorkingHours,
  DayWorkingHours
} from '@/utils/timeSlotUtils';
import { logger } from '@/utils/logger';

// Interfaces corrigidas
export interface Medico {
  id: string;
  display_name: string | null;
}

export interface LocalAtendimentoDb {
  id: string;
  nome_local: string;
  endereco: any;
  ativo: boolean;
  medico_id: string;
}

export interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco: any;
  horarios_disponiveis: TimeSlot[];
}

export interface HorarioConfig {
  local_id: string;
  inicio: string;
  fim: string;
  ativo: boolean;
  inicioAlmoco?: string;
  fimAlmoco?: string;
}

export interface MedicoConfig {
  duracaoConsulta: number;
  horarioAtendimento: Record<string, HorarioConfig[]>;
}

const checkAuthentication = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.error("User not authenticated", "NewAppointmentService");
    throw new Error("Você precisa estar logado para realizar esta ação");
  }
  return user;
};

export const newAppointmentService = {
  async getSpecialties(): Promise<string[]> {
    logger.info("Fetching specialties", "NewAppointmentService");
    console.log("🔍 newAppointmentService.getSpecialties: Iniciando busca...");
    try {
      await checkAuthentication();
      console.log("✅ Usuário autenticado, chamando RPC...");
      
      const { data, error } = await supabase.rpc('get_specialties');
      console.log("📊 RPC get_specialties response:", { data, error });
      
      if (error) {
        console.error("❌ Erro na RPC get_specialties:", error);
        throw new Error(`Erro ao buscar especialidades: ${error.message}`);
      }
      
      const specialties = (data || []).sort();
      console.log("✅ Especialidades processadas:", specialties);
      return specialties;
    } catch (error) {
      console.error("❌ Erro geral em getSpecialties:", error);
      logger.error("Failed to fetch specialties", "NewAppointmentService", error);
      throw error;
    }
  },

  async getDoctorsByLocationAndSpecialty(specialty: string, city: string, state: string): Promise<Medico[]> {
    logger.info("Fetching doctors by location and specialty", "NewAppointmentService");
    console.log("🔍 getDoctorsByLocationAndSpecialty:", { specialty, city, state });
    try {
      await checkAuthentication();
      
      const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', {
        p_specialty: specialty,
        p_city: city,
        p_state: state
      });
      
      console.log("👨‍⚕️ RPC get_doctors_by_location_and_specialty response:", { data, error });
      
      if (error) {
        console.error("❌ Erro na RPC get_doctors_by_location_and_specialty:", error);
        logger.error("Error fetching doctors by location", "NewAppointmentService", error);
        throw error;
      }
      
      const doctors = (data || []) as Medico[];
      console.log("✅ Médicos processados:", doctors);
      return doctors;
    } catch (error) {
      console.error("❌ Erro geral em getDoctorsByLocationAndSpecialty:", error);
      logger.error("Failed to fetch doctors", "NewAppointmentService", error);
      throw error;
    }
  },

  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    logger.info("Fetching available slots by doctor", "NewAppointmentService");
    console.log("🔍 getAvailableSlotsByDoctor:", { doctorId, date });
    try {
      await checkAuthentication();
      if (!doctorId || !date) {
        console.log("❌ Parâmetros faltando:", { doctorId, date });
        logger.info("Missing doctorId or date", "NewAppointmentService");
        return [];
      }

      // Buscar dados do médico
      console.log("👨‍⚕️ Buscando configurações do médico...");
      const { data: medico, error: medicoError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      console.log("📊 Médico data:", { medico, medicoError });

      if (medicoError) {
        console.error("❌ Erro ao buscar médico:", medicoError);
        logger.error("Error fetching doctor config", "NewAppointmentService", medicoError);
        throw new Error(`Erro ao buscar dados do médico: ${medicoError.message}`);
      }

      // Buscar locais do médico
      console.log("🏥 Buscando locais do médico...");
      const { data: locais, error: locaisError } = await supabase
        .from('locais_atendimento')
        .select('*')
        .eq('medico_id', doctorId)
        .eq('ativo', true);

      console.log("📍 Locais data:", { locais, locaisError });

      if (locaisError) {
        console.error("❌ Erro ao buscar locais:", locaisError);
        logger.error("Error fetching doctor locations", "NewAppointmentService", locaisError);
        throw new Error(`Erro ao buscar locais: ${locaisError.message}`);
      }

      if (!locais || locais.length === 0) {
        console.log("⚠️ Nenhum local ativo encontrado");
        logger.info("No active locations found for doctor", "NewAppointmentService");
        return [];
      }

      // Processar configurações
      const configuracoes = medico?.configuracoes as any || {};
      const duracaoConsulta = configuracoes.duracaoConsulta || 30;
      const horarioAtendimento = configuracoes.horarioAtendimento || {};
      
      console.log("⚙️ Configurações processadas:", { duracaoConsulta, horarioAtendimento });

      // Determinar dia da semana
      const diaDaSemana = new Date(date + 'T00:00:00').toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      console.log("📅 Dia da semana:", diaDaSemana);

      // Buscar consultas existentes
      console.log("📋 Buscando consultas existentes...");
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      const { data: appointments } = await supabase
        .from('consultas')
        .select('data_consulta, duracao_minutos, local_id')
        .eq('medico_id', doctorId)
        .gte('data_consulta', startOfDay.toISOString())
        .lte('data_consulta', endOfDay.toISOString());
      
      console.log("📋 Consultas existentes:", appointments);
      
      const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
        data_consulta: apt.data_consulta,
        duracao_minutos: apt.duracao_minutos || 30
      }));

      const locaisComHorarios: LocalComHorarios[] = [];

      // Processar cada local
      for (const local of locais) {
        const localTyped = local as LocalAtendimentoDb;
        console.log("🏢 Processando local:", localTyped.nome_local);
        
        // Buscar configuração de horário para este local
        const blocosDoLocal = horarioAtendimento[diaDaSemana] || [];
        console.log("⏰ Blocos do dia encontrados:", blocosDoLocal);
        
        // Filtrar blocos específicos para este local (se aplicável)
        const blocosAtivos = Array.isArray(blocosDoLocal) 
          ? blocosDoLocal.filter((bloco: any) => {
              if (typeof bloco === 'object' && bloco !== null) {
                // Se tem local_id específico, verificar se é para este local
                if (bloco.local_id) {
                  return bloco.local_id === localTyped.id && bloco.ativo !== false;
                }
                // Se não tem local_id específico, aplicar para todos os locais
                return bloco.ativo !== false;
              }
              return false;
            })
          : [];

        console.log("✅ Blocos ativos para este local:", blocosAtivos);

        if (blocosAtivos.length > 0) {
          // Criar WorkingHours para este local
          const workingHours: WorkingHours = {};
          workingHours[diaDaSemana] = blocosAtivos;

          console.log("🔧 WorkingHours criado:", workingHours);

          // Gerar slots para este local
          const horariosDisponiveis = generateTimeSlots({
            duracaoConsulta,
            horarioAtendimento: workingHours
          }, new Date(date + 'T00:00:00'), existingAppointments);

          console.log("⏰ Horários gerados:", horariosDisponiveis);

          if (horariosDisponiveis.length > 0) {
            locaisComHorarios.push({
              id: localTyped.id,
              nome_local: localTyped.nome_local,
              endereco: localTyped.endereco,
              horarios_disponiveis: horariosDisponiveis
            });
          }
        }
      }
      
      console.log("🎉 Resultado final:", locaisComHorarios);
      logger.info(`Found ${locaisComHorarios.length} locations with available slots`, "NewAppointmentService");
      return locaisComHorarios;

    } catch (error) {
      console.error("❌ Erro geral em getAvailableSlotsByDoctor:", error);
      logger.error("Failed to fetch available slots", "NewAppointmentService", error);
      throw error;
    }
  },

  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    data_consulta: string;
    tipo_consulta: string;
    local_id: string;
    local_consulta_texto: string;
  }) {
    logger.info("Scheduling appointment", "NewAppointmentService");
    try {
      await checkAuthentication();
      const { error } = await supabase.from('consultas').insert({
        paciente_id: appointmentData.paciente_id,
        medico_id: appointmentData.medico_id,
        data_consulta: appointmentData.data_consulta,
        tipo_consulta: appointmentData.tipo_consulta,
        local_id: appointmentData.local_id,
        local_consulta: appointmentData.local_consulta_texto,
        status: 'agendada',
      });
      if (error) throw error;
      logger.info("Appointment scheduled successfully", "NewAppointmentService");
      return { success: true };
    } catch (error) {
      logger.error("Failed to schedule appointment", "NewAppointmentService", error);
      throw error;
    }
  }
};
