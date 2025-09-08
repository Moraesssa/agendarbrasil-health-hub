// src/api/controllers/authController.js
// Lógica de negócio para autenticação

// Exemplo de função de login (a ser implementada)
exports.login = (req, res) => {
    const { email, senha } = req.body;

    try {
        // 1. Validate input data
        if (!email || !senha) {
            return res.status(400).json({ 
                error: 'Email e senha são obrigatórios' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Formato de email inválido' 
            });
        }

        // 2. Search user in database by email
        // Note: This should integrate with Supabase Auth in production
        console.log(`Tentativa de login para: ${email}`);
        
        // 3. For now, return a mock response
        // In production, integrate with Supabase authentication
        const mockUser = {
            id: 'user-123',
            email: email,
            role: 'paciente'
        };

        // 4. Generate JWT token
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        
        const token = jwt.sign(
            { 
                sub: mockUser.id,
                email: mockUser.email,
                role: mockUser.role 
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        // 5. Return token to client
        res.json({
            success: true,
            token,
            user: {
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
};
