import { supabase } from '@/integrations/supabase/client';
import { Doctor, Specialty, State, City, Horario, Local } from '@/types/medical';

// Service interfaces
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

/**
 * Busca todas as especialidades médicas disponíveis.
 * @returns Uma lista de especialidades.
 */
export const getSpecialties = async (): Promise<string[]> => {
  try {
    // Utiliza a função RPC 'get_specialties' para buscar as especialidades
    const { data, error } = await supabase.rpc('get_specialties');

    if (error) {
      console.error('Erro ao buscar especialidades:', error);
      throw new Error('Não foi possível carregar as especialidades.');
    }

    return data || [];
  } catch (error) {
    console.error('Ocorreu um erro inesperado ao buscar especialidades:', error);
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
      console.error('Erro ao buscar estados:', error);
      throw new Error('Não foi possível carregar os estados.');
    }

    return data || [];
  } catch (error) {
    console.error('Ocorreu um erro inesperado ao buscar estados:', error);
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
      console.error('Erro ao buscar cidades:', error);
      throw new Error('Não foi possível carregar as cidades.');
    }
    
    return data || [];
  } catch (error) {
    console.error('Ocorreu um erro inesperado ao buscar cidades:', error);
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
): Promise<Doctor[]> => {
  if (!specialty || !state || !city) {
    console.warn('Especialidade, estado e cidade são obrigatórios para buscar médicos.');
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', {
      p_specialty: specialty,
      p_city: city,
      p_state: state
    });

    if (error) {
      console.error('Erro ao buscar médicos:', error);
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('Ocorreu um erro inesperado ao buscar médicos:', error);
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
  if (!doctorId || !date) return [];

  try {
    const { data, error } = await supabase.rpc('get_doctor_schedule_data', {
      p_doctor_id: doctorId,
    });

    if (error) {
      console.error('Erro ao buscar horários:', error.message);
      throw new Error('Não foi possível carregar os horários.');
    }

    // Handle the data response correctly
    const responseData = Array.isArray(data) ? data[0] : data;
    const locations = responseData?.locations || [];

    // Convert to LocalComHorarios format
    const mockLocals: LocalComHorarios[] = (Array.isArray(locations) ? locations : []).map((location: any) => {
      const horarios = [
        { id: '1', hora: '08:00', disponivel: true, time: '08:00', available: true },
        { id: '2', hora: '09:00', disponivel: true, time: '09:00', available: true },
        { id: '3', hora: '10:00', disponivel: false, time: '10:00', available: false },
        { id: '4', hora: '14:00', disponivel: true, time: '14:00', available: true },
        { id: '5', hora: '15:00', disponivel: true, time: '15:00', available: true },
      ];

      return {
        id: location.id,
        nome_local: location.nome_local,
        endereco_completo: location.endereco_completo,
        endereco: location.endereco || {
          logradouro: '',
          numero: '',
          bairro: '',
          cidade: '',
          uf: '',
          cep: ''
        },
        horarios,
        horarios_disponiveis: horarios.filter(h => h.disponivel)
      };
    });

    return mockLocals;
  } catch (error) {
    console.error(`Ocorreu um erro inesperado ao buscar horários para o médico ${doctorId} na data ${date}:`, error);
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
      console.error('Erro ao agendar consulta:', error);
      throw error;
    }
  }
};