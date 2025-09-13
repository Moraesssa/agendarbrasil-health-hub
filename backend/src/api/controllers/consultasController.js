// src/api/controllers/consultasController.js
const Appointment = require('../../models/appointment');

/**
 * Controlador para listar todas as consultas de um usuário
 */
exports.listAppointments = async (req, res) => {
  try {
    // O ID do usuário e seu papel (paciente ou médico) viriam do token JWT
    // Por enquanto, vamos simular isso
    const userId = req.query.userId || req.user?.id;
    const userRole = req.query.role || req.user?.role || 'paciente';
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do usuário é obrigatório' 
      });
    }
    
    const appointments = await Appointment.listByUser(userId, userRole);
    
    res.status(200).json({
      success: true,
      consultas: appointments
    });
  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar consultas', 
      error: error.message 
    });
  }
};

/**
 * Controlador para buscar uma consulta pelo ID
 */
exports.getAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da consulta é obrigatório' 
      });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Consulta não encontrada' 
      });
    }
    
    res.status(200).json({
      success: true,
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar consulta', 
      error: error.message 
    });
  }
};

/**
 * Controlador para criar uma nova consulta
 */
exports.createAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    
    // Validação básica
    if (!appointmentData.paciente_id || !appointmentData.medico_id || !appointmentData.data_hora) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos. ID do paciente, ID do médico e data/hora são obrigatórios.' 
      });
    }
    
    const appointment = await Appointment.create(appointmentData);
    
    res.status(201).json({
      success: true,
      message: 'Consulta agendada com sucesso',
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao agendar consulta', 
      error: error.message 
    });
  }
};

/**
 * Controlador para atualizar uma consulta existente
 */
exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointmentData = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da consulta é obrigatório' 
      });
    }
    
    const appointment = await Appointment.update(appointmentId, appointmentData);
    
    res.status(200).json({
      success: true,
      message: 'Consulta atualizada com sucesso',
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao atualizar consulta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar consulta', 
      error: error.message 
    });
  }
};

/**
 * Controlador para cancelar uma consulta
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da consulta é obrigatório' 
      });
    }
    
    const appointment = await Appointment.cancel(appointmentId);
    
    res.status(200).json({
      success: true,
      message: 'Consulta cancelada com sucesso',
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao cancelar consulta', 
      error: error.message 
    });
  }
};

/**
 * Controlador para iniciar uma consulta
 */
exports.startAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da consulta é obrigatório' 
      });
    }
    
    const appointment = await Appointment.start(appointmentId);
    
    res.status(200).json({
      success: true,
      message: 'Consulta iniciada com sucesso',
      consulta: appointment,
      sala_virtual: {
        id: `sala_${appointmentId}`,
        url: `https://meet.agendarbrasil.com/sala/${appointmentId}`,
        token: `token_${Math.random().toString(36).substring(2, 15)}`
      }
    });
  } catch (error) {
    console.error('Erro ao iniciar consulta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao iniciar consulta', 
      error: error.message 
    });
  }
};