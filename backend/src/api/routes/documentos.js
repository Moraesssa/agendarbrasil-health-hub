// src/api/routes/documentos.js
const express = require('express');
const router = express.Router();

// Endpoint: POST /api/documentos (Gerar prescrição/atestado)
router.post('/', (req, res) => {
    res.status(201).json({ message: "Endpoint para gerar um novo documento. Lógica a ser implementada." });
});

module.exports = router;
