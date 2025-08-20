// src/api/routes/medicos.js
const express = require('express');
const router = express.Router();

// Endpoint: GET /api/medicos/{id}/agenda?data=YYYY-MM-DD
router.get('/:id/agenda', (req, res) => {
    const { id } = req.params;
    const { data } = req.query;
    res.status(200).json({
        message: `Endpoint de agenda do médico ${id} para a data ${data}. Lógica a ser implementada.`
    });
});

module.exports = router;
