
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { BaseUser, OnboardingStatus, UserPreferences } from '@/types/user';
import { authService } from '@/services/authService';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  const loadUserData = async (uid: string, retryCount = 0) => {
    try {
      console.log(`🔄 Tentativa ${retryCount + 1}/5 - Carregando dados do usuário: ${uid}`);
      
      const { profile, shouldRetry, error } = await authService.loadUserProfile(uid);

      if (error) {
        console.error('❌ Erro ao carregar perfil:', error);
        setLoading(false);
        return;
      }

      // Sistema de retry para aguardar o trigger do Supabase
      if (shouldRetry && retryCount < 4) { // 5 tentativas total (0-4)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s
        console.log(`⏳ Perfil não encontrado. Retry em ${delay}ms...`);
        setTimeout(() => {
          loadUserData(uid, retryCount + 1);
        }, delay);
        return;
      }

      // Se após todas as tentativas não encontrou o perfil
      if (!profile) {
        console.error('🚨 ERRO CRÍTICO: Perfil não encontrado após 5 tentativas!');
        console.error('Verifique se o trigger "handle_new_user" está funcionando no Supabase');
        setLoading(false);
        return;
      }

      console.log('✅ Perfil carregado com sucesso:', profile);

      // Configurar preferências padrão
      const defaultPreferences: UserPreferences = {
        notifications: true,
        theme: 'light',
        language: 'pt-BR'
      };

      let parsedPreferences = defaultPreferences;
      if (profile.preferences && typeof profile.preferences === 'object') {
        try {
          parsedPreferences = { ...defaultPreferences, ...profile.preferences };
        } catch (e) {
          console.warn('⚠️ Preferências inválidas, usando padrões');
        }
      }

      // Mapear dados do banco para o objeto da aplicação
      const baseUser: BaseUser = {
        uid: profile.id,
        email: profile.email,
        displayName: profile.display_name || profile.email.split('@')[0],
        photoURL: profile.photo_url || '',
        userType: profile.user_type,
        onboardingCompleted: profile.onboarding_completed,
        createdAt: new Date(profile.created_at),
        lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
        isActive: profile.is_active,
        preferences: parsedPreferences
      };

      console.log('🎯 UserData definido:', {
        userType: baseUser.userType,
        onboardingCompleted: baseUser.onboardingCompleted,
        displayName: baseUser.displayName
      });

      setUserData(baseUser);
      
      // Configurar status do onboarding se necessário
      if (!baseUser.onboardingCompleted && baseUser.userType) {
        const totalSteps = baseUser.userType === 'medico' ? 5 : 3;
        setOnboardingStatus({
          currentStep: 1,
          completedSteps: [],
          totalSteps,
          canProceed: true,
          errors: []
        });
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('💥 Erro inesperado em loadUserData:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Iniciando AuthState...');

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 Auth state mudou:', event, !!session?.user);
        
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          console.log('👤 Usuário detectado, carregando dados...');
          // Pequeno delay para garantir que a sessão foi estabelecida
          setTimeout(() => loadUserData(currentUser.id), 200);
        } else {
          console.log('🚪 Usuário deslogado, limpando dados...');
          setUserData(null);
          setOnboardingStatus(null);
          setLoading(false);
        }
      }
    );

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
       if (session?.user) {
           console.log('🔑 Sessão inicial encontrada');
           setSession(session);
           setUser(session.user);
           loadUserData(session.user.id);
       } else {
           console.log('🔒 Nenhuma sessão encontrada');
           setLoading(false);
       }
    });

    return () => {
      console.log('🧹 Limpando AuthState listener');
      subscription.unsubscribe();
    };
  }, []); // Array vazio = executa apenas uma vez

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
