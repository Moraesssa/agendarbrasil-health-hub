// src/models/user.js
const { createServiceClient } = require('../config/supabase');

class User {
  /**
   * Registra um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} - Usuário criado
   */
  static async register(userData) {
    const supabase = createServiceClient();
    
    // Registra o usuário usando o serviço de autenticação do Supabase
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nome: userData.nome,
          telefone: userData.telefone,
          tipo: userData.tipo || 'paciente'
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Autentica um usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Dados da sessão
   */
  static async login(email, password) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  /**
   * Solicita redefinição de senha
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async requestPasswordReset(email) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) throw error;
    return { success: true, message: 'Email de redefinição enviado' };
  }

  /**
   * Busca um usuário pelo ID
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Dados do usuário
   */
  static async findById(userId) {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = User;