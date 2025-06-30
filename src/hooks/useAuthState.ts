
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { BaseUser } from '@/types/user';
import { authService } from '@/services/authService';
import { logger } from '@/utils/logger';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  
  const loadingUserRef = useRef<string | null>(null);

  const loadUserData = useCallback(async (uid: string, retryCount = 0) => {
    if (loadingUserRef.current === uid) return;
    loadingUserRef.current = uid;
    
    logger.info(`Tentativa ${retryCount + 1}/5 - Carregando dados do usuário: ${uid}`);
    
    const { profile, shouldRetry, error } = await authService.loadUserProfile(uid);

    if (error) {
      logger.error('Erro ao carregar o perfil do usuário:', 'useAuthState', error);
      setLoading(false);
      loadingUserRef.current = null;
      return;
    }

    if (shouldRetry && retryCount < 5) {
      const delay = Math.pow(2, retryCount) * 100;
      setTimeout(() => {
        loadingUserRef.current = null;
        loadUserData(uid, retryCount + 1);
      }, delay);
      return;
    }

    if (!profile) {
      logger.error('ERRO CRÍTICO: Perfil não foi criado pelo trigger.', 'useAuthState');
      setLoading(false);
      loadingUserRef.current = null;
      return;
    }

    // Busca os dados específicos da tabela 'medicos'
    let medicoData = {};
    if (profile.user_type === 'medico') {
      const { data, error: medicoError } = await supabase
        .from('medicos')
        .select('especialidades, crm, configuracoes')
        .eq('user_id', uid)
        .maybeSingle();
      if (medicoError) {
        logger.error("Erro ao buscar dados do médico:", 'useAuthState', medicoError);
      }
      medicoData = data || {};
    }

    const fullUserData: BaseUser = {
      uid: profile.id,
      email: profile.email || '',
      displayName: profile.display_name || '',
      photoURL: profile.photo_url || '',
      userType: profile.user_type as any,
      onboardingCompleted: profile.onboarding_completed,
      createdAt: new Date(profile.created_at),
      lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
      isActive: profile.is_active,
      preferences: (profile.preferences || {}) as any,
      ...medicoData,
    };
    
    setUserData(fullUserData);
    logger.info('UserData definido:', 'useAuthState', { userType: fullUserData.userType, onboardingCompleted: fullUserData.onboardingCompleted });
    setLoading(false);
    loadingUserRef.current = null;
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setSession(session);
      
      if (currentUser) {
        loadUserData(currentUser.id);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadUserData]);

  return { user, session, userData, loading, onboardingStatus, setUserData, setOnboardingStatus };
};
