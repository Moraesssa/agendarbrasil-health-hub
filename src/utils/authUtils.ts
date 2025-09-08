import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { User } from '@supabase/supabase-js';

/**
 * Verifica se o usuário está autenticado
 * @returns O usuário autenticado
 * @throws Error se não estiver autenticado
 */
export const checkAuthentication = async (): Promise<User> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.error("User not authenticated", "AuthUtils");
    throw new Error("Você precisa estar logado para realizar esta ação");
  }
  return user;
};

/**
 * Verifica se o usuário está autenticado sem lançar erro
 * @returns O usuário autenticado ou null
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    logger.error("Error getting current user", "AuthUtils", error);
    return null;
  }
};

/**
 * Realiza logout e navega para a página de login
 * @param navigate - Função de navegação do React Router
 * @param logout - Função de logout do contexto de autenticação
 */
export const handleLogout = async (navigate: (path: string) => void, logout: () => Promise<void>): Promise<void> => {
  try {
    await logout();
    navigate("/login");
  } catch (error) {
    logger.error("Error during logout", "AuthUtils", error);
    throw error;
  }
};