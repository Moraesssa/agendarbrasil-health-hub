
import { User, Session } from '@supabase/supabase-js';
import { BaseUser, OnboardingStatus } from './user';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userData: BaseUser | null;
  loading: boolean;
  onboardingStatus: OnboardingStatus | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUserType: (type: 'medico' | 'paciente') => Promise<void>;
  updateOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
