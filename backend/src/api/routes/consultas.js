// src/api/routes/consultas.js
const express = require('express');
const router = express.Router();

// Endpoint: POST /api/consultas (Agendar nova consulta)
router.post('/', (req, res) => {
    res.status(201).json({ message: "Endpoint para agendar nova consulta. Lógica a ser implementada." });
});

// Endpoint: GET /api/consultas/{id} (Detalhes da consulta)
router.get('/:id', (req, res) => {
    res.status(200).json({ message: `Endpoint para ver detalhes da consulta ${req.params.id}. Lógica a ser implementada.` });
});

// Endpoint: POST /api/consultas/{id}/iniciar (Inicia a chamada)
router.post('/:id/iniciar', (req, res) => {
    res.status(200).json({ message: `Endpoint para iniciar a consulta ${req.params.id}. Lógica a ser implementada.` });
});

module.exports = router;
