// src/api/middlewares/authMiddleware.js
// Middleware para verificar a autenticação via JWT

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ error: 'Nenhum token fornecido' });
    }

    // O token vem no formato "Bearer <token>"
    const parts = authHeader.split(' ');

    if (!parts.length === 2) {
        return res.status(401).send({ error: 'Erro no formato do token' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).send({ error: 'Token mal formatado' });
    }

    // TODO:
    // 1. Verificar o token usando o segredo (process.env.JWT_SECRET)
    // 2. Se o token for válido, adicionar o ID do usuário ao objeto `req`
    // 3. Chamar `next()` para continuar o fluxo da requisição
    // 4. Se for inválido, retornar um erro 401.

    console.log('Middleware de autenticação alcançado. Lógica de verificação do JWT a ser implementada.');
    req.userId = '12345'; // Exemplo de ID de usuário decodificado
    next();
};
