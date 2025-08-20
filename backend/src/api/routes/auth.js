// src/api/routes/auth.js
const express = require('express');
const router = express.Router();
// const authController = require('../controllers/authController');

// Endpoint: POST /api/auth/login
// router.post('/login', authController.login);

router.post('/login', (req, res) => {
    res.status(200).json({ message: "Endpoint de login alcançado. Lógica a ser implementada." });
});

module.exports = router;
