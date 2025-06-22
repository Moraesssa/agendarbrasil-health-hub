
import { User, Session } from '@supabase/supabase-js';
import { BaseUser, UserType, OnboardingStatus } from '@/types/user';

export interface AuthContextType {
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

export interface AuthProviderProps {
  children: React.ReactNode;
}
