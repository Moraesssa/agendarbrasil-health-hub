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

    try {
        // Verify token using JWT secret
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jwt.verify(token, jwtSecret);
        
        // Add user ID to request object
        req.userId = decoded.sub || decoded.id;
        req.userRole = decoded.role;
        
        console.log(`Usuário autenticado: ${req.userId}`);
        next();
        
    } catch (error) {
        console.error('Erro na verificação do token:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        return res.status(401).json({ error: 'Falha na autenticação' });
    }
};
