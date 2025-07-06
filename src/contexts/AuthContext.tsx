
import { createContext, useContext } from 'react';
import { AuthContextType, AuthProviderProps } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const {
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    setUserData,
    setOnboardingStatus
  } = useAuthState();

  const authActions = useAuthActions(
    user,
    userData,
    onboardingStatus,
    setUserData,
    setOnboardingStatus
  );

  const value: AuthContextType = {
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    ...authActions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthContext for tests
export { AuthContext };
