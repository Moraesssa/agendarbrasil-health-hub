
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { BaseUser, OnboardingStatus } from '@/types/user';
import { authService } from '@/services/authService';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  const loadingUserRef = useRef<string | null>(null);

  const loadUserData = useCallback(async (uid: string, retryCount = 0) => {
    if (loadingUserRef.current === uid) return;
    loadingUserRef.current = uid;
    
    console.log(`🔄 Tentativa ${retryCount + 1}/3 - Carregando dados do usuário: ${uid}`);
    
    try {
      const { profile, shouldRetry, error } = await authService.loadUserProfile(uid);

      if (error) {
        console.error('Erro ao carregar o perfil do usuário:', error);
        setLoading(false);
        loadingUserRef.current = null;
        return;
      }

      if (shouldRetry && retryCount < 2) {
        const delay = (retryCount + 1) * 1000; // 1s, 2s
        console.log(`Perfil não encontrado, tentando novamente em ${delay}ms...`);
        setTimeout(() => {
          loadingUserRef.current = null;
          loadUserData(uid, retryCount + 1);
        }, delay);
        return;
      }

      if (!profile) {
        console.error('ERRO: Perfil não foi criado após todas as tentativas.');
        setLoading(false);
        loadingUserRef.current = null;
        return;
      }

      let roleData = {};
      if (profile.user_type === 'medico') {
        const { data: medicoData, error: medicoError } = await supabase
          .from('medicos')
          .select('especialidades, crm')
          .eq('user_id', uid)
          .single();
        
        if (!medicoError && medicoData) {
          roleData = medicoData;
        }
      }

      console.log('✅ Perfil carregado com sucesso:', profile);
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

      console.log('🎯 UserData definido:', {
          userType: baseUser.userType,
          onboardingCompleted: baseUser.onboardingCompleted,
          displayName: baseUser.displayName
      });
      setUserData(baseUser);
      setLoading(false);
      loadingUserRef.current = null;
    } catch (error) {
      console.error('Erro inesperado ao carregar dados do usuário:', error);
      setLoading(false);
      loadingUserRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log("🚀 Iniciando AuthState...");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔔 Auth state mudou: ${event}`, !!session?.user);
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_IN' && currentUser) {
          setLoading(true);
          loadUserData(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
          setUserData(null);
          setOnboardingStatus(null);
          setLoading(false);
          loadingUserRef.current = null;
        }
      }
    );

    // Verificação da sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            console.log("🔑 Sessão inicial encontrada");
            setSession(session);
            setUser(session.user);
            loadUserData(session.user.id);
        } else {
            setLoading(false);
        }
    });

    return () => {
      console.log("🧹 Limpando a inscrição do AuthState.");
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  return {
    user, 
    session, 
    userData, 
    loading, 
    onboardingStatus, 
    setUserData, 
    setOnboardingStatus
  };
};
