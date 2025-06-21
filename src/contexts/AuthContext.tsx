
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { BaseUser, UserType, OnboardingStatus } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userData: BaseUser | null;
  loading: boolean;
  onboardingStatus: OnboardingStatus | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUserType: (type: UserType) => Promise<void>;
  updateOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile loading to avoid blocking auth state change
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 0);
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

  const loadUserData = async (uid: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Se não encontrar perfil, isso é normal para novos usuários
        if (error.code === 'PGRST116') {
          console.log('Novo usuário - perfil não encontrado');
          setUserData(null);
        }
        return;
      }

      if (profile) {
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
          userType: profile.user_type as UserType,
          onboardingCompleted: profile.onboarding_completed,
          createdAt: new Date(profile.created_at),
          lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
          isActive: profile.is_active,
          preferences: parsedPreferences
        };

        setUserData(baseUser);
        
        // Carregar status de onboarding se não completado
        if (!baseUser.onboardingCompleted) {
          const totalSteps = baseUser.userType === 'medico' ? 7 : 5;
          setOnboardingStatus({
            currentStep: 1,
            completedSteps: [],
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

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/user-type`
        }
      });

      if (error) {
        console.error('Erro no login:', error);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserData(null);
      setOnboardingStatus(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const setUserType = async (type: UserType) => {
    if (!user) return;

    try {
      // Primeiro, criar ou atualizar o perfil do usuário
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email,
          photo_url: user.user_metadata?.avatar_url || '',
          user_type: type,
          onboarding_completed: false,
          last_login: new Date().toISOString(),
          is_active: true,
          preferences: {
            notifications: true,
            theme: 'light',
            language: 'pt-BR'
          }
        });

      if (upsertError) {
        console.error('Erro ao definir tipo de usuário:', upsertError);
        return;
      }

      // Atualizar o estado local
      const updatedUserData: BaseUser = {
        uid: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.full_name || user.email || '',
        photoURL: user.user_metadata?.avatar_url || '',
        userType: type,
        onboardingCompleted: false,
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
        preferences: {
          notifications: true,
          theme: 'light',
          language: 'pt-BR'
        }
      };

      setUserData(updatedUserData);
      
      // Atualizar status de onboarding
      const totalSteps = type === 'medico' ? 7 : 5;
      setOnboardingStatus({
        currentStep: 2,
        completedSteps: [1],
        totalSteps,
        canProceed: true,
        errors: []
      });
    } catch (error) {
      console.error('Erro ao definir tipo de usuário:', error);
    }
  };

  const updateOnboardingStep = async (step: number) => {
    if (!onboardingStatus) return;

    const newCompletedSteps = [...onboardingStatus.completedSteps];
    if (!newCompletedSteps.includes(step)) {
      newCompletedSteps.push(step);
    }

    setOnboardingStatus({
      ...onboardingStatus,
      currentStep: step + 1,
      completedSteps: newCompletedSteps,
      canProceed: step + 1 <= onboardingStatus.totalSteps
    });
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          last_login: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao completar onboarding:', error);
        return;
      }

      if (userData) {
        const updatedUserData = { ...userData, onboardingCompleted: true };
        setUserData(updatedUserData);
        
        toast({
          title: "Cadastro concluído!",
          description: "Bem-vindo ao AgendarBrasil",
        });
      }
      setOnboardingStatus(null);
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
    }
  };

  const value = {
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    signInWithGoogle,
    logout,
    setUserType,
    updateOnboardingStep,
    completeOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
