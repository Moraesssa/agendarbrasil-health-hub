// server.js
// Ponto de entrada principal para o servidor da API.

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
