// src/api/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint: POST /api/auth/register
router.post('/register', authController.register);

// Endpoint: POST /api/auth/login
router.post('/login', authController.login);

// Endpoint: POST /api/auth/password-reset/request
router.post('/password-reset/request', authController.requestPasswordReset);

module.exports = router;
