import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { normalizeAppointmentId } from '@/utils/appointment-id';

export interface Doctor {
  id: string;
  display_name: string;
  especialidades?: string[];
  crm?: string;
}

export interface TimeSlot {
  time: string;
  type: 'presencial' | 'teleconsulta';
  location_id?: string;
  estimated_duration?: number;
  confidence_score?: number;
}

export interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco?: any;
  horarios_disponiveis: Array<{ time: string; available: boolean }>;
}

async function searchDoctors(
  specialty: string,
  state: string,
  city: string
): Promise<Doctor[]> {
  const validSpecialty = specialty && specialty !== 'undefined' ? specialty : null;
  const validState = state && state !== 'undefined' ? state : null;
  const validCity = city && city !== 'undefined' ? city : null;
  if (!validSpecialty || !validState || !validCity) {
    return [];
  }
  try {
    const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', {
      p_specialty: validSpecialty,
      p_city: validCity,
      p_state: validState
    });
    if (error) {
      logger.error('Erro ao buscar médicos', 'schedulingService.searchDoctors', error);
      throw error;
    }
    return (data || []).map((d: any) => ({
      id: d.id?.toString() || '',
      display_name: d.display_name || 'Nome não informado',
      especialidades: Array.isArray(d.especialidades) ? d.especialidades : [],
      crm: d.crm || ''
    })).filter(d => d.id && d.id !== 'undefined');
  } catch (err) {
    logger.error('Erro inesperado ao buscar médicos', 'schedulingService.searchDoctors', err);
    return [];
  }
}

async function getAvailableSlots(
  doctorId: string,
  date: string
): Promise<LocalComHorarios[]> {
  if (!doctorId || doctorId === 'undefined' || !date || date === 'undefined') {
    return [];
  }
  try {
    const { data, error } = await supabase.rpc('get_doctor_schedule_v2', {
      p_doctor_id: doctorId,
      p_date: date
    });
    if (error) {
      logger.error('Erro ao buscar horários', 'schedulingService.getAvailableSlots', error);
      throw error;
    }
    const response = Array.isArray(data) ? data[0] : data;
    const locations = response?.locations || [];
    const dateOnly = date.split('T')[0];
    return (locations || [])
      .map((loc: any) => {
        const horarios = Array.isArray(loc.horarios_disponiveis)
          ? loc.horarios_disponiveis
              .map((h: any) => {
                if (typeof h === 'string') {
                  return { time: h, available: true };
                }
                const time = h?.time || h?.hora || '';
                const available = h?.available ?? h?.disponivel ?? true;
                return { time, available };
              })
              .filter((h: any) =>
                h.time &&
                (
                  !h.time.includes('T') ||
                  h.time.startsWith(dateOnly)
                )
              )
          : [];
        return {
          id: loc.id?.toString() || '',
          nome_local: loc.nome_local || 'Local não informado',
          endereco: loc.endereco || loc.endereco_completo || {},
          horarios_disponiveis: horarios
        };
      })
      .filter((l: LocalComHorarios) => l.id && l.id !== 'undefined');
  } catch (err) {
    logger.error('Erro inesperado ao buscar horários', 'schedulingService.getAvailableSlots', err);
    return [];
  }
}

async function createAppointment(params: {
  paciente_id: string;
  medico_id: string;
  consultation_date: string;
  consultation_type: string;
  local_id?: string;
  local_consulta_texto?: string;
  notes?: string;
}): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('reserve_appointment_v2', {
      p_doctor_id: params.medico_id,
      p_appointment_datetime: params.consultation_date,
      p_specialty: params.consultation_type,
      p_family_member_id: null,
      p_local_id: params.local_id ?? null
    });
    if (error) {
      logger.error('Erro ao agendar consulta', 'schedulingService.createAppointment', error);
      throw new Error(error.message || 'Erro ao agendar consulta');
    }
    const normalized = (data ?? []).map(result => {
      const appointmentId = normalizeAppointmentId(result.appointment_id);

      if (result.success && appointmentId === null) {
        throw new Error('Erro ao processar o identificador da consulta criada');
      }

      return {
        ...result,
        appointment_id: appointmentId
      };
    });

    return normalized;
  } catch (err) {
    logger.error('Erro inesperado ao agendar consulta', 'schedulingService.createAppointment', err);
    throw err;
  }
}

async function getSpecialties(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_specialties');
    if (error) {
      logger.error('Erro ao buscar especialidades', 'schedulingService.getSpecialties', error);
      return [];
    }
    return data || [];
  } catch (err) {
    logger.error('Erro inesperado ao buscar especialidades', 'schedulingService.getSpecialties', err);
    return [];
  }
}

export const schedulingService = {
  searchDoctors,
  getAvailableSlots,
  createAppointment,
  getSpecialties
};

export default schedulingService;
export type { Doctor as Medico, LocalComHorarios };
