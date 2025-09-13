// src/models/doctor.js
const { createServiceClient } = require('../config/supabase');

class Doctor {
  /**
   * Lista todos os médicos
   * @returns {Promise<Array>} - Lista de médicos
   */
  static async listAll() {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('medicos')
      .select(`
        *,
        especialidades(*)
      `);

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
   * @returns {Promise<Array>} - Horários disponíveis
   */
  static async checkAvailability(doctorId, date) {
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
      .from('consultas')
      .select('data_hora, duracao')
      .eq('medico_id', doctorId)
      .like('data_hora', `${date}%`)
      .not('status', 'eq', 'cancelada');

    if (appointmentsError) throw appointmentsError;

    // Se não houver agenda para esta data, retorna uma lista vazia
    if (!schedule || schedule.length === 0) {
      return [];
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
        const appointmentStart = new Date(appointment.data_hora);
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
    
    return availableSlots;
  }
}

module.exports = Doctor;