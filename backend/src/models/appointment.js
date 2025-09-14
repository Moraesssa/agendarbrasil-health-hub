// src/models/appointment.js
const { createServiceClient } = require('../config/supabase');

class Appointment {
  /**
   * Lista todas as consultas de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} role - Papel do usuário (paciente ou medico)
   * @returns {Promise<Array>} - Lista de consultas
   */
  static async listByUser(userId, role) {
    const supabase = createServiceClient();
    
    const query = supabase
      .from('consultas')
      .select(`
        *,
        paciente:paciente_id(*),
        medico:medico_id(*)
      `);
    
    // Filtra por paciente ou médico dependendo do papel do usuário
    if (role === 'paciente') {
      query.eq('paciente_id', userId);
    } else if (role === 'medico') {
      query.eq('medico_id', userId);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Busca uma consulta pelo ID
   * @param {string} appointmentId - ID da consulta
   * @returns {Promise<Object>} - Dados da consulta
   */
  static async findById(appointmentId) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('consultas')
      .select(`
        *,
        paciente:paciente_id(*),
        medico:medico_id(*)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cria uma nova consulta
   * @param {Object} appointmentData - Dados da consulta
   * @returns {Promise<Object>} - Consulta criada
   */
  static async create(appointmentData) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('consultas')
      .insert([
        {
          paciente_id: appointmentData.paciente_id,
          medico_id: appointmentData.medico_id,
          consultation_date: appointmentData.consultation_date,
          consultation_type: appointmentData.consultation_type,
          status: 'agendada',
          notes: appointmentData.notes
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Atualiza uma consulta existente
   * @param {string} appointmentId - ID da consulta
   * @param {Object} appointmentData - Novos dados da consulta
   * @returns {Promise<Object>} - Consulta atualizada
   */
  static async update(appointmentId, appointmentData) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('consultas')
      .update(appointmentData)
      .eq('id', appointmentId)
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Cancela uma consulta
   * @param {string} appointmentId - ID da consulta
   * @returns {Promise<Object>} - Consulta cancelada
   */
  static async cancel(appointmentId) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('consultas')
      .update({ status: 'cancelada' })
      .eq('id', appointmentId)
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Inicia uma consulta
   * @param {string} appointmentId - ID da consulta
   * @returns {Promise<Object>} - Consulta iniciada
   */
  static async start(appointmentId) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('consultas')
      .update({ 
        status: 'em_andamento',
        inicio_real: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select();

    if (error) throw error;
    return data[0];
  }
}

module.exports = Appointment;