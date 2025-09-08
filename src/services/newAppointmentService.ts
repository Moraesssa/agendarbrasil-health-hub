import { supabase } from '@/integrations/supabase/client';
import { 
  generateTimeSlots, 
  TimeSlot,
  ExistingAppointment,
  WorkingHours,
  getDayName
} from '@/utils/timeSlotUtils';
import { logger } from '@/utils/logger';
import { specialtyService } from '@/services/specialtyService';
import { checkAuthentication } from '@/utils/authUtils';

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

// Função para verificar se um horário específico ainda está disponível
const checkAvailabilityBeforeScheduling = async (
  doctorId: string, 
  appointmentDateTime: string
): Promise<boolean> => {
  const { data: existingAppointment, error } = await supabase
    .from('consultas')
    .select('id')
    .eq('medico_id', doctorId)
    .eq('consultation_date', appointmentDateTime)
    .in('status', ['agendada', 'confirmada'])
    .limit(1);

  if (error) {
    logger.error("Error checking appointment availability", "NewAppointmentService", error);
    throw new Error("Erro ao verificar disponibilidade do horário");
  }

  return !existingAppointment || existingAppointment.length === 0;
};

export const newAppointmentService = {
  async getSpecialties(): Promise<string[]> {
    logger.info("Fetching specialties", "NewAppointmentService");
    try {
      // Public access: no authentication required
      const specialties = await specialtyService.getAllSpecialties();
      return Array.isArray(specialties) ? specialties.sort() : [];
    } catch (error) {
      logger.error("Failed to fetch specialties", "NewAppointmentService", error);
      throw error;
    }
  },

  async getDoctorsByLocationAndSpecialty(specialty: string, city: string, state: string): Promise<Medico[]> {
    logger.info("Fetching doctors by location and specialty", "NewAppointmentService");
    try {
      await checkAuthentication();
      
      const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', {
        p_specialty: specialty,
        p_city: city,
        p_state: state
      });
      
      if (error) {
        console.error("❌ Erro na RPC get_doctors_for_scheduling:", error);
        logger.error("Error fetching doctors by location", "NewAppointmentService", error);
        throw error;
      }
      
      const doctors = (data || []).map(doctor => ({
        id: doctor.id,
        display_name: doctor.display_name
      }));
      return doctors;
    } catch (error) {
      logger.error("Failed to fetch doctors", "NewAppointmentService", error);
      throw error;
    }
  },

  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    logger.info("Fetching available slots by doctor", "NewAppointmentService");
    try {
      await checkAuthentication();
      if (!doctorId || !date) {
        logger.info("Missing doctorId or date", "NewAppointmentService");
        return [];
      }

      // Buscar dados do médico
      const { data: medico, error: medicoError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      if (medicoError) {
        console.error("❌ Erro ao buscar médico:", medicoError);
        logger.error("Error fetching doctor config", "NewAppointmentService", medicoError);
        throw new Error(`Erro ao buscar dados do médico: ${medicoError.message}`);
      }

      // Buscar locais do médico
      const { data: locais, error: locaisError } = await supabase
        .from('locais_atendimento')
        .select('*')
        .eq('medico_id', doctorId)
        .eq('ativo', true);

      if (locaisError) {
        console.error("❌ Erro ao buscar locais:", locaisError);
        logger.error("Error fetching doctor locations", "NewAppointmentService", locaisError);
        throw new Error(`Erro ao buscar locais: ${locaisError.message}`);
      }

      if (!locais || locais.length === 0) {
        logger.info("No active locations found for doctor", "NewAppointmentService");
        return [];
      }

      // Processar configurações
      const configuracoes = medico?.configuracoes as any || {};
      const duracaoConsulta = configuracoes.duracaoConsulta || 30;
      const horarioAtendimento = configuracoes.horarioAtendimento || {};

      // Determinar dia da semana usando a função do timeSlotUtils
      const diaDaSemana = getDayName(new Date(date + 'T00:00:00'));
      console.log("🔍 Dia da semana calculado:", diaDaSemana, "para data:", date);

      // Buscar consultas existentes
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      const { data: appointments } = await supabase
        .from('consultas')
        .select('consultation_date')
        .eq('medico_id', doctorId)
        .gte('consultation_date', startOfDay.toISOString())
        .lte('consultation_date', endOfDay.toISOString());
      
      const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
        data_consulta: apt.consultation_date,
        duracao_minutos: 30
      }));

      const locaisComHorarios: LocalComHorarios[] = [];

      // Processar cada local
      for (const local of locais) {
        const localTyped = local as LocalAtendimentoDb;
        
        // Buscar configuração de horário para este local
        const blocosDoLocal = horarioAtendimento[diaDaSemana] || [];
        console.log("🔍 Blocos encontrados para", diaDaSemana, ":", blocosDoLocal);
        
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

        if (blocosAtivos.length > 0) {
          // Criar WorkingHours para este local
          const workingHours: WorkingHours = {};
          workingHours[diaDaSemana] = blocosAtivos;

          // Gerar slots para este local
          const horariosDisponiveis = generateTimeSlots({
            duracaoConsulta,
            horarioAtendimento: workingHours
          }, new Date(date + 'T00:00:00'), existingAppointments);

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
      
      logger.info(`Found ${locaisComHorarios.length} locations with available slots`, "NewAppointmentService");
      return locaisComHorarios;

    } catch (error) {
      logger.error("Failed to fetch available slots", "NewAppointmentService", error);
      throw error;
    }
  },

  async createTemporaryReservation(
    doctorId: string,
    dateTime: string,
    localId: string | undefined
  ): Promise<{ data: any; sessionId: string; expiresAt: Date }> {
    logger.info("Creating temporary reservation", "NewAppointmentService");
    try {
      const user = await checkAuthentication();
      const sessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      const { data, error } = await supabase
        .from('temporary_reservations')
        .insert({
          medico_id: doctorId,
          paciente_id: user.id,
          data_consulta: dateTime,
          local_id: localId,
          session_id: sessionId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      return { data, sessionId, expiresAt };
    } catch (error) {
      logger.error("Failed to create temporary reservation", "NewAppointmentService", error);
      throw error;
    }
  },

  async cleanupTemporaryReservation(sessionId: string): Promise<void> {
    logger.info("Cleaning up temporary reservation", "NewAppointmentService");
    if (!sessionId) return;
    try {
      await supabase
        .from('temporary_reservations')
        .delete()
        .eq('session_id', sessionId);
    } catch (error) {
      logger.error('Error cleaning up temporary reservation', "NewAppointmentService", error);
      // Do not throw, as this is a background cleanup task.
    }
  },

  async extendReservation(sessionId: string): Promise<{ expiresAt: Date } | null> {
    logger.info("Extending temporary reservation", "NewAppointmentService");
    try {
      await checkAuthentication();
      const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const { error } = await supabase
        .from('temporary_reservations')
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('session_id', sessionId);
      if (error) throw error;
      return { expiresAt: newExpiresAt };
    } catch (error) {
      logger.error('Error extending reservation', "NewAppointmentService", error);
      throw error;
    }
  },

  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    consultation_date: string;
    consultation_type: string;
    local_consulta_texto: string;
  }) {
    logger.info("Scheduling appointment", "NewAppointmentService");
    try {
      await checkAuthentication();

      // Verificação final de disponibilidade antes do agendamento
      const isAvailable = await checkAvailabilityBeforeScheduling(
        appointmentData.medico_id, 
        appointmentData.consultation_date
      );

      if (!isAvailable) {
        throw new Error("Este horário não está mais disponível. Por favor, selecione outro horário.");
      }

      // Create appointment with future date validation
      const appointmentDate = new Date(appointmentData.consultation_date);
      const now = new Date();
      
      if (appointmentDate <= now) {
        throw new Error("Não é possível agendar consultas para horários passados.");
      }

      const { error } = await supabase.from('consultas').insert({
        paciente_id: appointmentData.paciente_id,
        medico_id: appointmentData.medico_id,
        consultation_date: appointmentData.consultation_date,
        consultation_type: appointmentData.consultation_type,
        status: 'agendada',
        status_pagamento: 'pendente',
        patient_name: 'Paciente',
        patient_email: 'paciente@email.com'
      });

      if (error) {
        // Verificar se é erro de constraint violation (agendamento duplicado)
        if (error.code === '23505' && error.message?.includes('idx_consultas_unique_slot')) {
          logger.warn("Attempt to schedule duplicate appointment", "NewAppointmentService", { 
            doctorId: appointmentData.medico_id, 
            dateTime: appointmentData.consultation_date 
          });
          throw new Error("Este horário já foi ocupado por outro paciente. Por favor, escolha outro horário disponível.");
        }
        
        logger.error("Error scheduling appointment", "NewAppointmentService", error);
        throw new Error(`Erro ao agendar consulta: ${error.message}`);
      }

      logger.info("Appointment scheduled successfully", "NewAppointmentService");
      return { success: true };
    } catch (error) {
      logger.error("Failed to schedule appointment", "NewAppointmentService", error);
      throw error;
    }
  }
};
