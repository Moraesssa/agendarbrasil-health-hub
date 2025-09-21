// src/api/controllers/consultasController.js
const Appointment = require('../../models/appointment');

const ensureAuthenticated = (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return false;
  }

  return true;
};

const handleControllerError = (res, error, defaultMessage) => {
  const status = error.status || 500;

  return res.status(status).json({
    success: false,
    message: error.status ? error.message : defaultMessage,
    ...(error.status ? {} : { error: error.message })
  });
};

/**
 * Controlador para listar todas as consultas de um usuário
 */
exports.listAppointments = async (req, res) => {
  if (!ensureAuthenticated(req, res)) {
    return;
  }

  try {
    const { id: userId, role } = req.user;
    const appointments = await Appointment.listByUser(userId, role);

    res.status(200).json({
      success: true,
      consultas: appointments
    });
  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    handleControllerError(res, error, 'Erro ao listar consultas');
  }
};

/**
 * Controlador para buscar uma consulta pelo ID
 */
exports.getAppointment = async (req, res) => {
  if (!ensureAuthenticated(req, res)) {
    return;
  }

  try {
    const appointmentId = req.params.id;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'ID da consulta é obrigatório'
      });
    }

    const appointment = await Appointment.findById(appointmentId, req.user);

    res.status(200).json({
      success: true,
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    handleControllerError(res, error, 'Erro ao buscar consulta');
  }
};

/**
 * Controlador para criar uma nova consulta
 */
exports.createAppointment = async (req, res) => {
  if (!ensureAuthenticated(req, res)) {
    return;
  }

  try {
    const appointmentData = req.body || {};

    const missingFields = [];

    if (!appointmentData.consultation_date) missingFields.push('consultation_date');
    if (!appointmentData.consultation_type) missingFields.push('consultation_type');

    if (!appointmentData.medico_id && req.user.role !== 'medico') {
      missingFields.push('medico_id');
    }

    if (!appointmentData.paciente_id && req.user.role !== 'paciente') {
      missingFields.push('paciente_id');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Dados incompletos. Campos obrigatórios ausentes: ' + missingFields.join(', ')
      });
    }

    const appointment = await Appointment.create(appointmentData, req.user);

    res.status(201).json({
      success: true,
      message: 'Consulta agendada com sucesso',
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    handleControllerError(res, error, 'Erro ao agendar consulta');
  }
};

/**
 * Controlador para atualizar uma consulta existente
 */
exports.updateAppointment = async (req, res) => {
  if (!ensureAuthenticated(req, res)) {
    return;
  }

  try {
    const appointmentId = req.params.id;
    const appointmentData = req.body || {};

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'ID da consulta é obrigatório'
      });
    }

    const appointment = await Appointment.update(appointmentId, appointmentData, req.user);

    res.status(200).json({
      success: true,
      message: 'Consulta atualizada com sucesso',
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao atualizar consulta:', error);
    handleControllerError(res, error, 'Erro ao atualizar consulta');
  }
};

/**
 * Controlador para cancelar uma consulta
 */
exports.cancelAppointment = async (req, res) => {
  if (!ensureAuthenticated(req, res)) {
    return;
  }

  try {
    const appointmentId = req.params.id;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'ID da consulta é obrigatório'
      });
    }

    const appointment = await Appointment.cancel(appointmentId, req.user);

    res.status(200).json({
      success: true,
      message: 'Consulta cancelada com sucesso',
      consulta: appointment
    });
  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    handleControllerError(res, error, 'Erro ao cancelar consulta');
  }
};

/**
 * Controlador para iniciar uma consulta
 */
exports.startAppointment = async (req, res) => {
  if (!ensureAuthenticated(req, res)) {
    return;
  }

  try {
    const appointmentId = req.params.id;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'ID da consulta é obrigatório'
      });
    }

    const appointment = await Appointment.start(appointmentId, req.user);

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
    handleControllerError(res, error, 'Erro ao iniciar consulta');
  }
};
