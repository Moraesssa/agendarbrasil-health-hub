// src/api/routes/consultas.js
const express = require('express');
const consultasController = require('../controllers/consultasController');
const router = express.Router();

// Endpoint: GET /api/consultas (Listar todas as consultas)
router.get('/', consultasController.listAppointments);

// Endpoint: POST /api/consultas (Agendar nova consulta)
router.post('/', consultasController.createAppointment);

// Endpoint: GET /api/consultas/{id} (Detalhes da consulta)
router.get('/:id', consultasController.getAppointment);

// Endpoint: PUT /api/consultas/{id} (Atualizar consulta)
router.put('/:id', consultasController.updateAppointment);

// Endpoint: DELETE /api/consultas/{id} (Cancelar consulta)
router.delete('/:id', consultasController.cancelAppointment);

// Endpoint: POST /api/consultas/{id}/iniciar (Inicia a chamada)
router.post('/:id/iniciar', consultasController.startAppointment);

module.exports = router;
