// src/models/appointment.js
const { createServiceClient } = require('../config/supabase');

const APPOINTMENT_SELECT = `
  *,
  paciente:paciente_id(*),
  medico:medico_id(*)
`;

const createHttpError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const ensureAuthenticatedUser = (user) => {
  if (!user || !user.id) {
    throw createHttpError('Usuário não autenticado', 401);
  }
};

const ensureParticipantAccess = (appointment, user) => {
  ensureAuthenticatedUser(user);

  if (!appointment) {
    throw createHttpError('Consulta não encontrada', 404);
  }

  const userId = user.id;

  if (appointment.paciente_id !== userId && appointment.medico_id !== userId) {
    throw createHttpError('Usuário não tem permissão para acessar esta consulta', 403);
  }
};

const sanitizeUpdatePayload = (appointmentData = {}) => {
  const payload = { ...appointmentData };

  delete payload.id;
  delete payload.paciente_id;
  delete payload.medico_id;
  delete payload.created_at;
  delete payload.updated_at;

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

class Appointment {
  /**
   * Lista todas as consultas de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} role - Papel do usuário (paciente, medico, etc.)
   * @returns {Promise<Array>} - Lista de consultas
   */
  static async listByUser(userId, role) {
    ensureAuthenticatedUser({ id: userId });

    const supabase = createServiceClient();

    const query = supabase
      .from('consultas')
      .select(APPOINTMENT_SELECT);

    if (role === 'medico') {
      query.eq('medico_id', userId);
    } else if (role === 'paciente') {
      query.eq('paciente_id', userId);
    } else {
      query.or(`paciente_id.eq.${userId},medico_id.eq.${userId}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async fetchById(appointmentId) {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('consultas')
      .select(APPOINTMENT_SELECT)
      .eq('id', appointmentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Busca uma consulta pelo ID garantindo que o usuário tem acesso
   * @param {string} appointmentId
   * @param {{ id: string }} user
   * @returns {Promise<Object>}
   */
  static async findById(appointmentId, user) {
    const appointment = await this.fetchById(appointmentId);
    ensureParticipantAccess(appointment, user);
    return appointment;
  }

  /**
   * Cria uma nova consulta garantindo que o usuário é participante
   * @param {Object} appointmentData
   * @param {{ id: string, role?: string }} user
   * @returns {Promise<Object>}
   */
  static async create(appointmentData, user) {
    ensureAuthenticatedUser(user);

    const userId = user.id;
    const role = user.role;

    const pacienteId = role === 'paciente' ? userId : appointmentData.paciente_id;
    const medicoId = role === 'medico' ? userId : appointmentData.medico_id;

    if (!pacienteId || !medicoId) {
      throw createHttpError('IDs do paciente e do médico são obrigatórios', 400);
    }

    if (pacienteId !== userId && medicoId !== userId) {
      throw createHttpError('Usuário não tem permissão para criar consulta sem participação', 403);
    }

    const missingFields = [];

    if (!appointmentData.consultation_date) missingFields.push('consultation_date');
    if (!appointmentData.consultation_type) missingFields.push('consultation_type');

    if (missingFields.length > 0) {
      throw createHttpError(
        'Dados incompletos. Campos obrigatórios ausentes: ' + missingFields.join(', '),
        400
      );
    }

    const payload = {
      paciente_id: pacienteId,
      medico_id: medicoId,
      consultation_date: appointmentData.consultation_date,
      consultation_type: appointmentData.consultation_type,
      status: appointmentData.status || 'agendada',
      notes: appointmentData.notes ?? null
    };

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('consultas')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza uma consulta existente garantindo que o usuário tem acesso
   * @param {string} appointmentId
   * @param {Object} appointmentData
   * @param {{ id: string }} user
   * @returns {Promise<Object>}
   */
  static async update(appointmentId, appointmentData, user) {
    ensureAuthenticatedUser(user);
    await this.findById(appointmentId, user);

    const updatePayload = sanitizeUpdatePayload(appointmentData);

    if (Object.keys(updatePayload).length === 0) {
      throw createHttpError('Nenhum dado válido para atualização foi fornecido', 400);
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('consultas')
      .update(updatePayload)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cancela uma consulta garantindo que o usuário tem acesso
   * @param {string} appointmentId
   * @param {{ id: string }} user
   * @returns {Promise<Object>}
   */
  static async cancel(appointmentId, user) {
    ensureAuthenticatedUser(user);
    await this.findById(appointmentId, user);

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('consultas')
      .update({ status: 'cancelada' })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Inicia uma consulta garantindo que o usuário tem acesso
   * @param {string} appointmentId
   * @param {{ id: string }} user
   * @returns {Promise<Object>}
   */
  static async start(appointmentId, user) {
    ensureAuthenticatedUser(user);
    await this.findById(appointmentId, user);

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('consultas')
      .update({
        status: 'em_andamento',
        inicio_real: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = Appointment;
