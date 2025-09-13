// src/api/controllers/authController.js
// Lógica de negócio para autenticação
const User = require('../../models/user');

/**
 * Controlador para registro de usuário
 */
exports.register = async (req, res) => {
  try {
    const userData = req.body;
    
    // Validação básica
    if (!userData.email || !userData.password || !userData.nome) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos. Email, senha e nome são obrigatórios.' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Formato de email inválido' 
      });
    }
    
    const result = await User.register(userData);
    
    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: result.user.id,
        email: result.user.email,
        nome: userData.nome
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    
    // Tratamento de erros específicos do Supabase
    if (error.message && error.message.includes('already registered')) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email já registrado' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao registrar usuário', 
      error: error.message 
    });
  }
};

/**
 * Controlador para login de usuário
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validação básica
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Formato de email inválido' 
      });
    }
    
    const result = await User.login(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: result.user.id,
        email: result.user.email,
        nome: result.user.user_metadata?.nome,
        role: result.user.user_metadata?.tipo || 'paciente'
      },
      token: result.session.access_token,
      refreshToken: result.session.refresh_token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    
    // Tratamento de erros específicos
    if (error.message && error.message.includes('Invalid login credentials')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao fazer login', 
      error: error.message 
    });
  }
};

/**
 * Controlador para solicitação de redefinição de senha
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validação básica
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email é obrigatório' 
      });
    }
    
    await User.requestPasswordReset(email);
    
    res.status(200).json({
      success: true,
      message: 'Se o email existir, um link de redefinição de senha será enviado'
    });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    
    // Por segurança, não revelamos se o email existe ou não
    res.status(200).json({
      success: true,
      message: 'Se o email existir, um link de redefinição de senha será enviado'
    });
  }
};
