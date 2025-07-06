
import { createContext, useContext } from 'react';
import { AuthContextType, AuthProviderProps } from '@/types/auth';
import { useAuthStateV2 } from '@/hooks/useAuthStateV2';
import { useAuthActions } from '@/hooks/useAuthActions';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
    error,
    retry,
    setUserData
  } = useAuthStateV2();

  const authActions = useAuthActions(
    user,
    userData,
    null, // onboardingStatus removido para simplificar
    setUserData,
    () => {} // setOnboardingStatus removido
  );

  const value: AuthContextType = {
    user,
    session,
    userData,
    loading,
    onboardingStatus: null, // Simplificado
    ...authActions
  };

  return (
    <ErrorBoundary context="AuthProvider">
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </ErrorBoundary>
  );
};

// Export AuthContext for tests
export { AuthContext };
