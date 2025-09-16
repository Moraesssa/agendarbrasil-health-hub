import { supabase } from '@/integrations/supabase/client';
import { Doctor, Specialty, State, City, Horario } from '@/types/medical';
import { logger } from '@/utils/logger';
import {
  generateTimeSlots,
  DoctorConfig,
  WorkingHours,
  DayWorkingHours,
  ExistingAppointment
} from '@/utils/timeSlotUtils';

// Service interfaces - Aligned with RPC function return
export interface Medico {
  id: string;
  display_name: string;
  especialidades?: string[];
  crm?: string;
}

export interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco_completo?: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  horarios: Horario[];
  horarios_disponiveis: Horario[];
}

const parseNumberField = (value: any): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

const normalizeTimeValue = (value: any): string | null => {
  if (typeof value !== 'string') return null;

  let timePart = value.trim();
  if (!timePart) return null;

  if (timePart.includes('T')) {
    const [, extracted] = timePart.split('T');
    timePart = extracted || '';
  }

  if (timePart.includes(' ')) {
    const parts = timePart.split(' ');
    timePart = parts[parts.length - 1] || '';
  }

  const [hours, minutes] = timePart.split(':');
  if (hours === undefined || minutes === undefined) return null;

  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const normalizeWorkingHours = (value: any): WorkingHours => {
  const result: WorkingHours = {};

  if (!value || typeof value !== 'object') {
    return result;
  }

  Object.entries(value).forEach(([dayKey, blocks]) => {
    if (!Array.isArray(blocks)) return;

    const normalizedBlocks: DayWorkingHours[] = blocks
      .map((block: any) => {
        if (!block || typeof block !== 'object') return null;

        const inicio = normalizeTimeValue(block.inicio ?? block.start ?? block.hora_inicio);
        const fim = normalizeTimeValue(block.fim ?? block.end ?? block.hora_fim);
        if (!inicio || !fim) return null;

        const inicioAlmoco = normalizeTimeValue(block.inicioAlmoco ?? block.almoco_inicio ?? block.lunch_start);
        const fimAlmoco = normalizeTimeValue(block.fimAlmoco ?? block.almoco_fim ?? block.lunch_end);
        const localIdRaw = block.local_id ?? block.localId ?? block.location_id;
        const ativo = block.ativo !== undefined
          ? Boolean(block.ativo)
          : block.active !== undefined
            ? Boolean(block.active)
            : true;

        const normalized: DayWorkingHours = {
          inicio,
          fim,
          ativo,
          inicioAlmoco: inicioAlmoco || undefined,
          fimAlmoco: fimAlmoco || undefined,
          local_id: localIdRaw != null ? String(localIdRaw) : undefined
        };

        return normalized;
      })
      .filter((block): block is DayWorkingHours => Boolean(block));

    if (normalizedBlocks.length > 0) {
      result[dayKey] = normalizedBlocks;
    }
  });

  return result;
};

const normalizeDoctorConfig = (value: any): DoctorConfig => {
  let rawConfig = value;

  if (typeof rawConfig === 'string') {
    try {
      rawConfig = JSON.parse(rawConfig);
    } catch (error) {
      logger.warn('[getHorarios] Falha ao converter doctor_config string para objeto', 'appointmentService.getHorarios', error);
      rawConfig = null;
    }
  }

  if (!rawConfig || typeof rawConfig !== 'object') {
    return {
      duracaoConsulta: 30,
      bufferMinutos: 0,
      horarioAtendimento: {}
    };
  }

  const duracaoConsulta = parseNumberField(rawConfig.duracaoConsulta ?? rawConfig.duracao_consulta) ?? 30;
  const bufferMinutos = parseNumberField(rawConfig.bufferMinutos ?? rawConfig.buffer_minutos) ?? 0;
  const workingHours = normalizeWorkingHours(rawConfig.horarioAtendimento ?? rawConfig.horario_atendimento);

  const normalizedConfig: DoctorConfig = {
    duracaoConsulta,
    bufferMinutos
  };

  if (Object.keys(workingHours).length > 0) {
    normalizedConfig.horarioAtendimento = workingHours;
  }

  return normalizedConfig;
};

const extractAvailableTimes = (rawSlots: any): string[] => {
  if (!Array.isArray(rawSlots)) return [];

  return rawSlots
    .map((slot: any) => {
      if (typeof slot === 'string') {
        return normalizeTimeValue(slot);
      }

      if (slot && typeof slot === 'object') {
        return normalizeTimeValue(slot.time ?? slot.hora ?? slot.slot_time);
      }

      return null;
    })
    .filter((time): time is string => Boolean(time));
};

/**
 * Busca todas as especialidades médicas disponíveis.
 * @returns Uma lista de especialidades.
 */
export const getSpecialties = async (): Promise<string[]> => {
  try {
    // Utiliza a função RPC 'get_specialties' para buscar as especialidades
    const { data, error } = await supabase.rpc('get_specialties');

    if (error) {
      logger.error('Erro ao buscar especialidades', 'appointmentService.getSpecialties', error);
      throw new Error('Não foi possível carregar as especialidades.');
    }

    return data || [];
  } catch (error) {
    logger.error('Ocorreu um erro inesperado ao buscar especialidades', 'appointmentService.getSpecialties', error);
    return [];
  }
};

/**
 * Busca todos os estados (UFs) que possuem médicos cadastrados.
 * @returns Uma lista de estados.
 */
export const getStates = async (): Promise<State[]> => {
  try {
    const { data, error } = await supabase.rpc('get_available_states');

    if (error) {
      logger.error('Erro ao buscar estados', 'appointmentService.getStates', error);
      throw new Error('Não foi possível carregar os estados.');
    }

    return data || [];
  } catch (error) {
    logger.error('Ocorreu um erro inesperado ao buscar estados', 'appointmentService.getStates', error);
    return [];
  }
};

/**
 * Busca cidades com base no estado (UF) selecionado.
 * @param uf - A sigla do estado.
 * @returns Uma lista de cidades.
 */
export const getCities = async (uf: string): Promise<City[]> => {
  if (!uf) return [];

  try {
    const { data, error } = await supabase.rpc('get_available_cities', { state_uf: uf });

    if (error) {
      logger.error('Erro ao buscar cidades', 'appointmentService.getCities', error);
      throw new Error('Não foi possível carregar as cidades.');
    }
    
    return data || [];
  } catch (error) {
    logger.error('Ocorreu um erro inesperado ao buscar cidades', 'appointmentService.getCities', error);
    return [];
  }
};

/**
 * Busca médicos com base na especialidade, estado e cidade.
 * @param specialty - A especialidade desejada.
 * @param state - O estado (UF).
 * @param city - A cidade.
 * @returns Uma lista de médicos que atendem aos critérios.
 */
export const getMedicos = async (
  specialty: string,
  state: string,
  city: string
): Promise<Medico[]> => {
  // Validar parâmetros para evitar undefined
  const validSpecialty = specialty && specialty !== 'undefined' ? specialty : null;
  const validState = state && state !== 'undefined' ? state : null;
  const validCity = city && city !== 'undefined' ? city : null;

  if (!validSpecialty || !validState || !validCity) {
    console.warn('⚠️ [getMedicos] Parâmetros inválidos:', { 
      original: { specialty, state, city },
      validated: { validSpecialty, validState, validCity }
    });
    return [];
  }

  try {
    logger.debug('[getMedicos] Buscando médicos com parâmetros validados', 'appointmentService.getMedicos', { 
      specialty: validSpecialty, 
      state: validState, 
      city: validCity 
    });
    
    const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', {
      p_specialty: validSpecialty,
      p_city: validCity,
      p_state: validState
    });

    if (error) {
      logger.error('[getMedicos] Erro na RPC', 'appointmentService.getMedicos', error);
      throw error;
    }

    logger.debug('[getMedicos] Dados retornados', 'appointmentService.getMedicos', data);
    
    // Convert to Medico format with UUID validation
    const doctors: Medico[] = (data || []).map((doctor: any) => ({
      id: doctor.id?.toString() || '',
      display_name: doctor.display_name || 'Nome não informado',
      especialidades: Array.isArray(doctor.especialidades) ? doctor.especialidades : [],
      crm: doctor.crm || ''
    })).filter(doctor => doctor.id && doctor.id !== 'undefined');

    logger.debug('[getMedicos] Médicos formatados', 'appointmentService.getMedicos', doctors);
    return doctors;

  } catch (error) {
    logger.error('[getMedicos] Erro inesperado', 'appointmentService.getMedicos', error);
    return [];
  }
};


/**
 * Busca os horários e locais disponíveis para um médico em uma data específica.
 * @param doctorId - O ID do médico.
 * @param date - A data no formato 'YYYY-MM-DD'.
 * @returns Uma lista de locais com seus respectivos horários disponíveis.
 */
export const getHorarios = async (doctorId: string, date: string): Promise<LocalComHorarios[]> => {
  // Validar parâmetros
  if (!doctorId || doctorId === 'undefined' || !date || date === 'undefined') {
    console.warn('⚠️ [getHorarios] Parâmetros inválidos:', { doctorId, date });
    return [];
  }

  try {
    logger.debug('[getHorarios] Buscando horários para', 'appointmentService.getHorarios', { doctorId, date });

    const normalizedDate = date.split('T')[0];

    const { data, error } = await supabase.rpc('get_doctor_schedule_data', {
      p_doctor_id: doctorId,
      p_date: normalizedDate
    });

    if (error) {
      logger.error('[getHorarios] Erro na RPC', 'appointmentService.getHorarios', error);
      throw new Error('Não foi possível carregar os horários.');
    }

    logger.debug('[getHorarios] Dados retornados', 'appointmentService.getHorarios', data);

    const responseData = Array.isArray(data) ? data[0] : data;
    const doctorConfig = normalizeDoctorConfig(responseData?.doctor_config);
    const locations = Array.isArray(responseData?.locations) ? responseData.locations : [];

    logger.debug('[getHorarios] Dados normalizados', 'appointmentService.getHorarios', {
      hasHorario: Boolean(doctorConfig.horarioAtendimento && Object.keys(doctorConfig.horarioAtendimento).length > 0),
      duracaoConsulta: doctorConfig.duracaoConsulta,
      bufferMinutos: doctorConfig.bufferMinutos,
      totalLocations: locations.length
    });

    const scheduleDate = new Date(`${normalizedDate}T00:00:00`);
    const startOfDay = new Date(`${normalizedDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${normalizedDate}T23:59:59.999Z`);

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('consultas')
      .select('consultation_date, local_id, status')
      .eq('medico_id', doctorId)
      .gte('consultation_date', startOfDay.toISOString())
      .lte('consultation_date', endOfDay.toISOString())
      .in('status', ['pending', 'agendada', 'confirmada', 'em_andamento', 'scheduled', 'confirmed']);

    if (appointmentsError) {
      logger.warn('[getHorarios] Falha ao buscar consultas existentes', 'appointmentService.getHorarios', appointmentsError);
    }

    const existingAppointmentsData = Array.isArray(appointmentsData) ? appointmentsData : [];

    logger.debug('[getHorarios] Consultas existentes identificadas', 'appointmentService.getHorarios', {
      total: existingAppointmentsData.length
    });

    const consultationDuration = doctorConfig.duracaoConsulta || 30;

    const locaisComHorarios: LocalComHorarios[] = locations
      .map((location: any) => {
        const locationId = location?.id?.toString() || '';
        if (!locationId || locationId === 'undefined') {
          return null;
        }

        const availableTimes = extractAvailableTimes(location.horarios_disponiveis);
        const availableTimeSet = new Set(availableTimes);
        const hasExplicitAvailability = availableTimeSet.size > 0;

        const locationAppointments: ExistingAppointment[] = existingAppointmentsData
          .filter((appointment: any) => {
            if (!appointment?.consultation_date) return false;
            if (!appointment.local_id) return true;
            return String(appointment.local_id) === locationId;
          })
          .map((appointment: any) => ({
            data_consulta: appointment.consultation_date,
            duracao_minutos: consultationDuration
          }));

        let generatedSlots = generateTimeSlots(
          doctorConfig,
          scheduleDate,
          locationAppointments,
          locationId
        );

        if ((!generatedSlots || generatedSlots.length === 0) && availableTimes.length > 0) {
          generatedSlots = availableTimes.map(time => ({ time, available: true }));
        }

        const horariosMap = new Map<string, Horario>();

        (generatedSlots || []).forEach((slot, index) => {
          const normalizedTime = normalizeTimeValue(slot.time) ?? slot.time;
          if (!normalizedTime) return;

          const isAvailable = hasExplicitAvailability
            ? availableTimeSet.has(normalizedTime)
            : slot.available ?? true;

          const horario: Horario = {
            id: `${locationId}-${normalizedTime.replace(/:/g, '')}-${index}`,
            hora: normalizedTime,
            disponivel: isAvailable,
            time: normalizedTime,
            available: isAvailable
          };

          const existing = horariosMap.get(normalizedTime);
          if (!existing || (!existing.available && isAvailable)) {
            horariosMap.set(normalizedTime, horario);
          }
        });

        if (horariosMap.size === 0 && availableTimes.length > 0) {
          availableTimes.forEach((time, index) => {
            if (!horariosMap.has(time)) {
              horariosMap.set(time, {
                id: `${locationId}-fallback-${time.replace(/:/g, '')}-${index}`,
                hora: time,
                disponivel: true,
                time,
                available: true
              });
            }
          });
        }

        const horarios = Array.from(horariosMap.values()).sort((a, b) => a.time.localeCompare(b.time));
        const horarios_disponiveis = horarios.filter(horario => horario.available);

        const enderecoBase = (location.endereco && typeof location.endereco === 'object') ? location.endereco : {};
        const endereco = {
          logradouro: enderecoBase.logradouro || location.endereco_completo || location.logradouro || '',
          numero: enderecoBase.numero || location.numero || '',
          bairro: enderecoBase.bairro || location.bairro || '',
          cidade: enderecoBase.cidade || location.cidade || '',
          uf: enderecoBase.uf || location.uf || location.estado || '',
          cep: enderecoBase.cep || location.cep || ''
        };

        return {
          id: locationId,
          nome_local: location.nome_local || location.name || 'Local não informado',
          endereco_completo: location.endereco_completo || '',
          endereco,
          horarios,
          horarios_disponiveis
        } as LocalComHorarios;
      })
      .filter((local): local is LocalComHorarios => Boolean(local) && local.id && local.id !== 'undefined');

    logger.debug('[getHorarios] Locais formatados', 'appointmentService.getHorarios', locaisComHorarios);
    return locaisComHorarios;
  } catch (error) {
  logger.error('[getHorarios] Erro inesperado', 'appointmentService.getHorarios', { doctorId, date, error });
    return [];
  }
};

// Export appointmentService object for compatibility
export const appointmentService = {
  getSpecialties,
  getStates,
  getCities,
  getMedicos,
  getHorarios,
  getDoctorsByLocationAndSpecialty: getMedicos,
  getAvailableSlotsByDoctor: getHorarios,
  scheduleAppointment: async (appointmentData: any) => {
    try {
      const { data, error } = await supabase.rpc('reserve_appointment_slot', {
        p_doctor_id: appointmentData.medico_id,
        p_patient_id: appointmentData.paciente_id,
        p_family_member_id: null,
        p_scheduled_by_id: appointmentData.paciente_id,
        p_appointment_datetime: appointmentData.data_consulta,
        p_specialty: appointmentData.tipo_consulta
      });

      if (error) {
        throw new Error(error.message || 'Erro ao agendar consulta');
      }

      return data;
    } catch (error) {
      logger.error('Erro ao agendar consulta', 'appointmentService.scheduleAppointment', error);
      throw error;
    }
  }
};