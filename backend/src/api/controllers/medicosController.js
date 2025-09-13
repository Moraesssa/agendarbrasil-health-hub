// src/api/controllers/medicosController.js
const Doctor = require('../../models/doctor');

/**
 * Controlador para listar todos os médicos
 */
exports.listDoctors = async (req, res) => {
  try {
    // Parâmetros de filtro opcionais
    const { especialidade, nome } = req.query;
    
    const doctors = await Doctor.listAll({ especialidade, nome });
    
    res.status(200).json({
      success: true,
      medicos: doctors
    });
  } catch (error) {
    console.error('Erro ao listar médicos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar médicos', 
      error: error.message 
    });
  }
};

/**
 * Controlador para buscar um médico pelo ID
 */
exports.getDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    if (!doctorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do médico é obrigatório' 
      });
    }
    
    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Médico não encontrado' 
      });
    }
    
    res.status(200).json({
      success: true,
      medico: doctor
    });
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar médico', 
      error: error.message 
    });
  }
};

/**
 * Controlador para buscar a agenda de um médico
 */
exports.getDoctorSchedule = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { data_inicio, data_fim } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do médico é obrigatório' 
      });
    }
    
    // Validação básica das datas
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ 
        success: false, 
        message: 'Período (data_inicio e data_fim) é obrigatório' 
      });
    }
    
    const schedule = await Doctor.getSchedule(doctorId, data_inicio, data_fim);
    
    res.status(200).json({
      success: true,
      agenda: schedule
    });
  } catch (error) {
    console.error('Erro ao buscar agenda do médico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar agenda do médico', 
      error: error.message 
    });
  }
};

/**
 * Controlador para verificar disponibilidade de um médico
 */
exports.checkDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { data, hora } = req.query;
    
    if (!doctorId || !data || !hora) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do médico, data e hora são obrigatórios' 
      });
    }
    
    const availability = await Doctor.checkAvailability(doctorId, data, hora);
    
    res.status(200).json({
      success: true,
      disponivel: availability.disponivel,
      horarios_disponiveis: availability.horarios_disponiveis
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do médico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar disponibilidade do médico', 
      error: error.message 
    });
  }
};