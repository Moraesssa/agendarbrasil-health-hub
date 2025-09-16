import { useErrorHandling } from '@/hooks/useErrorHandling';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';
import { isValidUUID, sanitizeUUID } from '@/utils/uuidValidation';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook principal para operações do AgendarBrasil
 * Combina error handling, monitoramento e validação UUID
 */
export const useAgendarBrasil = () => {
  const errorHandler = useErrorHandling({
    showToast: true,
    retryAttempts: 3
  });

  const { isSystemHealthy, checkSystemHealth } = useSystemMonitoring();

  // Função para buscar médicos com validação
  const fetchDoctors = async (specialty?: string, city?: string, state?: string) => {
    return await errorHandler.handleAsyncOperation(async () => {
      const { data, error } = await supabase.rpc('get_doctors_for_scheduling', {
        p_specialty: specialty || null,
        p_city: city || null,
        p_state: state || null
      });

      if (error) throw error;
      return data || [];
    }, 'Busca de médicos');
  };

  // Função para buscar dados de agenda com validação UUID
  const fetchDoctorSchedule = async (doctorId: string, date?: string) => {
    const validDoctorId = sanitizeUUID(doctorId);
    if (!validDoctorId) {
      throw new Error('ID do médico inválido');
    }

    const baseDate = date ?? new Date().toISOString();
    const targetDate = baseDate.split('T')[0];

    return await errorHandler.handleAsyncOperation(async () => {
      const { data, error } = await supabase.rpc('get_doctor_schedule_data', {
        p_doctor_id: validDoctorId,
        p_date: targetDate
      });

      if (error) throw error;
      return data?.[0] || null;
    }, 'Busca de agenda médica');
  };

  // Função para reservar horário com validação completa
  const reserveAppointment = async (
    doctorId: string,
    patientId: string,
    appointmentDateTime: string,
    specialty: string,
    familyMemberId?: string
  ) => {
    // Validar todos os UUIDs
    const validDoctorId = sanitizeUUID(doctorId);
    const validPatientId = sanitizeUUID(patientId);
    const validFamilyMemberId = familyMemberId ? sanitizeUUID(familyMemberId) : null;

    if (!validDoctorId || !validPatientId) {
      throw new Error('IDs de médico ou paciente inválidos');
    }

    return await errorHandler.handleAsyncOperation(async () => {
      const { data, error } = await supabase.rpc('reserve_appointment_slot', {
        p_doctor_id: validDoctorId,
        p_patient_id: validPatientId,
        p_family_member_id: validFamilyMemberId,
        p_scheduled_by_id: validPatientId,
        p_appointment_datetime: appointmentDateTime,
        p_specialty: specialty
      });

      if (error) throw error;
      
      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.message || 'Erro ao reservar horário');
      }

      return result;
    }, 'Reserva de consulta', {
      showSuccessToast: true,
      successMessage: 'Consulta agendada com sucesso!'
    });
  };

  // Função para verificar pagamento com validação
  const verifyPayment = async (consultaId: string) => {
    const validConsultaId = sanitizeUUID(consultaId);
    if (!validConsultaId) {
      throw new Error('ID da consulta inválido');
    }

    return await errorHandler.handleAsyncOperation(async () => {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { consulta_id: validConsultaId }
      });

      if (error) throw error;
      return data;
    }, 'Verificação de pagamento');
  };

  return {
    // Estado
    isSystemHealthy,
    ...errorHandler,

    // Ações
    fetchDoctors,
    fetchDoctorSchedule,
    reserveAppointment,
    verifyPayment,
    checkSystemHealth,

    // Utilitários
    isValidUUID,
    sanitizeUUID
  };
};