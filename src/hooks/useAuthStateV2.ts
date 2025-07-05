
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { BaseUser } from '@/types/user';
import { authService } from '@/services/authService';
import { logger } from '@/utils/logger';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
const MAX_LOADING_TIME = 30000; // 30 segundos máximo

export const useAuthStateV2 = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadingUserRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (maxLoadingTimeoutRef.current) {
      clearTimeout(maxLoadingTimeoutRef.current);
      maxLoadingTimeoutRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setError(null);
    loadingUserRef.current = null;
    clearTimeouts();
  }, [clearTimeouts]);

  const loadUserData = useCallback(async (uid: string, retryCount = 0) => {
    if (loadingUserRef.current === uid) return;
    loadingUserRef.current = uid;
    
    logger.info(`Carregando dados do usuário (tentativa ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`, "useAuthStateV2", { uid });
    
    try {
      const { profile, shouldRetry, error: profileError } = await authService.loadUserProfile(uid);

      if (profileError) {
        throw new Error(`Erro ao carregar perfil: ${profileError.message}`);
      }

      if (shouldRetry && retryCount < MAX_RETRY_ATTEMPTS - 1) {
        const delay = RETRY_DELAY * (retryCount + 1);
        logger.info(`Perfil não encontrado, tentando novamente em ${delay}ms`, "useAuthStateV2");
        
        retryTimeoutRef.current = setTimeout(() => {
          loadingUserRef.current = null;
          loadUserData(uid, retryCount + 1);
        }, delay);
        return;
      }

      if (!profile) {
        throw new Error('Perfil do usuário não encontrado após todas as tentativas');
      }

      // Carregar dados específicos do tipo de usuário
      let roleData = {};
      if (profile.user_type === 'medico') {
        try {
          const { data: medicoData, error: medicoError } = await supabase
            .from('medicos')
            .select('especialidades, crm')
            .eq('user_id', uid)
            .single();
          
          if (!medicoError && medicoData) {
            roleData = medicoData;
          }
        } catch (err) {
          logger.warn("Erro ao carregar dados do médico", "useAuthStateV2", err);
        }
      }

      const baseUser: BaseUser = {
        uid: profile.id,
        email: profile.email,
        displayName: profile.display_name || '',
        photoURL: profile.photo_url || '',
        userType: profile.user_type,
        onboardingCompleted: profile.onboarding_completed,
        createdAt: new Date(profile.created_at),
        lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
        isActive: profile.is_active,
        preferences: {
          notifications: true,
          theme: 'light',
          language: 'pt-BR',
          ...profile.preferences,
        },
        ...roleData,
      };

      logger.info('Perfil carregado com sucesso', "useAuthStateV2", {
        userType: baseUser.userType,
        onboardingCompleted: baseUser.onboardingCompleted
      });

      setUserData(baseUser);
      setError(null);
      setLoading(false);
      resetState();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao carregar dados do usuário', "useAuthStateV2", { error: errorMessage, uid });
      
      setError(errorMessage);
      setLoading(false);
      resetState();
    }
  }, [resetState]);

  useEffect(() => {
    logger.info("Iniciando AuthStateV2", "useAuthStateV2");
    
    // Timeout máximo para loading
    maxLoadingTimeoutRef.current = setTimeout(() => {
      if (loading) {
        logger.error("Timeout no carregamento da autenticação", "useAuthStateV2");
        setError("Timeout no carregamento. Verifique sua conexão.");
        setLoading(false);
      }
    }, MAX_LOADING_TIME);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info(`Auth state mudou: ${event}`, "useAuthStateV2", { hasSession: !!session?.user });
        
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_IN' && currentUser) {
          setLoading(true);
          setError(null);
          loadUserData(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
          setUserData(null);
          setError(null);
          setLoading(false);
          resetState();
        }
      }
    );

    // Verificação da sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        logger.info("Sessão inicial encontrada", "useAuthStateV2");
        setSession(session);
        setUser(session.user);
        loadUserData(session.user.id);
      } else {
        setLoading(false);
        clearTimeouts();
      }
    }).catch((error) => {
      logger.error("Erro ao obter sessão inicial", "useAuthStateV2", error);
      setError("Erro ao verificar autenticação");
      setLoading(false);
    });

    return () => {
      logger.info("Limpando AuthStateV2", "useAuthStateV2");
      subscription.unsubscribe();
      clearTimeouts();
    };
  }, [loadUserData, resetState, clearTimeouts, loading]);

  const retry = useCallback(() => {
    if (user) {
      setLoading(true);
      setError(null);
      loadUserData(user.id);
    } else {
      setLoading(true);
      setError(null);
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          loadUserData(session.user.id);
        } else {
          setLoading(false);
        }
      });
    }
  }, [user, loadUserData]);

  return {
    user, 
    session, 
    userData, 
    loading, 
    error,
    retry,
    setUserData
  };
};
