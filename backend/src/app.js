// src/app.js
// Arquivo de configuração principal do Express.

const express = require('express');
const app = express();

// Middlewares
app.use(express.json()); // Para parsear JSON no corpo das requisições

// Rotas da API
const authRoutes = require('./api/routes/auth');
const medicosRoutes = require('./api/routes/medicos');
const consultasRoutes = require('./api/routes/consultas');
const documentosRoutes = require('./api/routes/documentos');

// Rota de Teste
app.get('/', (req, res) => {
  res.send('API da Plataforma de Telemedicina está no ar!');
});

// Registrar as rotas
app.use('/api/auth', authRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/documentos', documentosRoutes);

module.exports = app;
