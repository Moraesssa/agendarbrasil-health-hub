
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { BaseUser, UserType, OnboardingStatus } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
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
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserData(user.uid);
      } else {
        setUserData(null);
        setOnboardingStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as BaseUser;
        setUserData(data);
        
        // Carregar status de onboarding se não completado
        if (!data.onboardingCompleted) {
          const totalSteps = data.userType === 'medico' ? 7 : 5;
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
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verificar se é primeiro login
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Primeiro login - criar documento base
        const newUser: BaseUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          userType: 'paciente', // Padrão, será alterado na seleção
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

        await setDoc(doc(db, 'users', user.uid), newUser);
        setUserData(newUser);
      } else {
        // Atualizar último login
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date()
        });
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao AgendarBrasil",
      });
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
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setOnboardingStatus(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const setUserType = async (type: UserType) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        userType: type
      });

      if (userData) {
        const updatedData = { ...userData, userType: type };
        setUserData(updatedData);
        
        // Atualizar status de onboarding
        const totalSteps = type === 'medico' ? 7 : 5;
        setOnboardingStatus({
          currentStep: 2,
          completedSteps: [1],
          totalSteps,
          canProceed: true,
          errors: []
        });
      }
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
      await updateDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true
      });

      if (userData) {
        setUserData({ ...userData, onboardingCompleted: true });
      }
      setOnboardingStatus(null);

      toast({
        title: "Cadastro concluído!",
        description: "Bem-vindo ao AgendarBrasil",
      });
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
    }
  };

  const value = {
    user,
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
