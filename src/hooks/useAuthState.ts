
import { useState, useEffect } from 'react';
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

  const loadUserData = async (uid: string) => {
    try {
      console.log('Loading user data for:', uid);
      
      const { profile, shouldRetry, error } = await authService.loadUserProfile(uid);

      if (shouldRetry) {
        console.log('Perfil não encontrado, aguardando criação automática...');
        setTimeout(() => {
          loadUserData(uid);
        }, 1000);
        return;
      }

      if (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        return;
      }

      if (profile) {
        console.log('Profile loaded:', profile);
        
        // Safely parse preferences with fallback
        const defaultPreferences = {
          notifications: true,
          theme: 'light' as const,
          language: 'pt-BR' as const
        };

        let parsedPreferences = defaultPreferences;
        if (profile.preferences && typeof profile.preferences === 'object') {
          try {
            const prefs = profile.preferences as any;
            if (typeof prefs.notifications === 'boolean' && 
                (prefs.theme === 'light' || prefs.theme === 'dark') &&
                prefs.language === 'pt-BR') {
              parsedPreferences = prefs;
            }
          } catch (e) {
            console.warn('Invalid preferences format, using defaults');
          }
        }

        const baseUser: BaseUser = {
          uid: profile.id,
          email: profile.email,
          displayName: profile.display_name || '',
          photoURL: profile.photo_url || '',
          userType: profile.user_type as any,
          onboardingCompleted: profile.onboarding_completed,
          createdAt: new Date(profile.created_at),
          lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
          isActive: profile.is_active,
          preferences: parsedPreferences
        };

        console.log('Setting userData:', baseUser);
        setUserData(baseUser);
        
        // Carregar status de onboarding se não completado
        if (!baseUser.onboardingCompleted) {
          const totalSteps = baseUser.userType === 'medico' ? 7 : 5;
          setOnboardingStatus({
            currentStep: baseUser.userType ? 2 : 1,
            completedSteps: baseUser.userType ? [1] : [],
            totalSteps,
            canProceed: true,
            errors: []
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load user data immediately when session is available
          loadUserData(session.user.id);
        } else {
          setUserData(null);
          setOnboardingStatus(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
