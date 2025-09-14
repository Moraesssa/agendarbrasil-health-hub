// src/models/doctor.js
const { createServiceClient } = require('../config/supabase');

// Nome canônico da tabela de consultas
const CONSULTA_TABLE = 'consultas';

class Doctor {
  /**
   * Lista todos os médicos com filtros opcionais
   * @param {Object} [filters] - Filtros opcionais
   * @param {string} [filters.especialidade] - Especialidade para filtrar
   * @param {string} [filters.nome] - Nome parcial para filtrar
   * @returns {Promise<Array>} - Lista de médicos
   */
  static async listAll({ especialidade, nome } = {}) {
    const supabase = createServiceClient();

    let query = supabase
      .from('medicos')
      .select(`
        *,
        especialidades(*)
      `);

    if (especialidade) {
      query = query.eq('especialidade', especialidade);
    }

    if (nome) {
      query = query.ilike('nome', `%${nome}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Busca um médico pelo ID
   * @param {string} doctorId - ID do médico
   * @returns {Promise<Object>} - Dados do médico
   */
  static async findById(doctorId) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('medicos')
      .select(`
        *,
        especialidades(*)
      `)
      .eq('id', doctorId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Busca a agenda de um médico
   * @param {string} doctorId - ID do médico
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<Array>} - Agenda do médico
   */
  static async getSchedule(doctorId, startDate, endDate) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('agenda_medico')
      .select('*')
      .eq('medico_id', doctorId)
      .gte('data', startDate)
      .lte('data', endDate);

    if (error) throw error;
    return data;
  }

  /**
   * Verifica a disponibilidade de um médico
   * @param {string} doctorId - ID do médico
   * @param {string} date - Data (YYYY-MM-DD)
   * @param {string} [hora] - Hora opcional (HH:MM)
   * @returns {Promise<{disponivel: boolean, horarios_disponiveis: Array}>}
   */
  static async checkAvailability(doctorId, date, hora) {
    const supabase = createServiceClient();
    
    // Busca a agenda do médico para a data especificada
    const { data: schedule, error: scheduleError } = await supabase
      .from('agenda_medico')
      .select('*')
      .eq('medico_id', doctorId)
      .eq('data', date);

    if (scheduleError) throw scheduleError;

    // Busca as consultas já agendadas para o médico na data especificada
    const { data: appointments, error: appointmentsError } = await supabase
      .from(CONSULTA_TABLE)
      .select('consultation_date, duracao')
      .eq('medico_id', doctorId)
      .like('consultation_date', `${date}%`)
      .not('status', 'eq', 'cancelada');

    if (appointmentsError) throw appointmentsError;

    // Se não houver agenda para esta data, retorna uma lista vazia
    if (!schedule || schedule.length === 0) {
      return {
        disponivel: false,
        horarios_disponiveis: []
      };
    }

    // Processa os horários disponíveis
    const workHours = schedule[0];
    const startTime = new Date(`${date}T${workHours.hora_inicio}`);
    const endTime = new Date(`${date}T${workHours.hora_fim}`);
    const slotDuration = 30; // duração de cada slot em minutos
    
    const availableSlots = [];
    const currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const slotTime = currentTime.toISOString();
      
      // Verifica se o horário já está ocupado
      const isBooked = appointments.some(appointment => {
        const appointmentStart = new Date(appointment.consultation_date);
        const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duracao || 30) * 60000);
        return currentTime >= appointmentStart && currentTime < appointmentEnd;
      });
      
      if (!isBooked) {
        availableSlots.push({
          hora: slotTime,
          disponivel: true
        });
      }
      
      // Avança para o próximo slot
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }
    
    let disponivel;
    if (hora) {
      const targetTime = new Date(`${date}T${hora}`);
      disponivel = availableSlots.some(slot => new Date(slot.hora).getTime() === targetTime.getTime());
    } else {
      disponivel = availableSlots.length > 0;
    }

    return {
      disponivel,
      horarios_disponiveis: availableSlots
    };
  }
}

module.exports = Doctor;