// src/api/routes/medicos.js
const express = require('express');
const medicosController = require('../controllers/medicosController');
const router = express.Router();

// Endpoint: GET /api/medicos (Listar todos os médicos)
router.get('/', medicosController.listDoctors);

// Endpoint: GET /api/medicos/{id} (Detalhes do médico)
router.get('/:id', medicosController.getDoctor);

// Endpoint: GET /api/medicos/{id}/agenda?data=YYYY-MM-DD
router.get('/:id/agenda', medicosController.getDoctorSchedule);

// Endpoint: GET /api/doctors/{id}/availability (Verificar disponibilidade do médico)
router.get('/:id/availability', medicosController.checkDoctorAvailability);

module.exports = router;
