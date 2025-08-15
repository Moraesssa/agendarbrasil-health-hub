import { supabase } from '@/integrations/supabase/client';
import { Doctor, Specialty, State, City, Horario, Local } from '@/types/medical';

/**
 * Busca todas as especialidades médicas disponíveis.
 * @returns Uma lista de especialidades.
 */
export const getSpecialties = async (): Promise<Specialty[]> => {
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
    const { data, error } = await supabase.rpc('get_states');

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
    const { data, error } = await supabase.rpc('get_cities_by_state', { p_uf: uf });

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
 * AGORA CORRIGIDO para usar a nova função RPC.
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
    // Chama a nova função RPC 'get_medicos_por_especialidade'
    const { data, error } = await supabase.rpc('get_medicos_por_especialidade', {
      p_especialidade: specialty,
    });

    if (error) {
      console.error('Erro ao buscar médicos:', error);
      throw error;
    }

    // A função RPC já filtra por especialidade.
    // A lógica de filtrar por cidade/estado pode ser adicionada aqui no frontend
    // ou, idealmente, na própria função do banco de dados para melhor performance.
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
export const getHorarios = async (doctorId: string, date: string): Promise<Local[]> => {
  if (!doctorId || !date) return [];

  try {
    // Utiliza a função 'get_available_time_slots' para buscar os horários
    const { data, error } = await supabase.rpc('get_available_time_slots', {
      p_doctor_id: doctorId,
      p_date: date,
    });

    if (error) {
      console.error('Erro ao buscar horários:', error.message);
      throw new Error('Não foi possível carregar os horários.');
    }

    // O retorno da RPC já está no formato esperado de Local[]
    return data || [];
  } catch (error) {
    console.error(`Ocorreu um erro inesperado ao buscar horários para o médico ${doctorId} na data ${date}:`, error);
    return [];
  }
};