import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AuthContextType, AuthProviderProps } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useSecurityConfig } from '@/hooks/useSecurityConfig';

// Create context with a default value to avoid undefined issues
const AuthContext = createContext<AuthContextType | null>(null);

// Create the useAuth hook with comprehensive error handling
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  // Call all hooks unconditionally at the top level
  const authState = useAuthState();
  const {
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    setUserData,
    setOnboardingStatus
  } = authState;

  const authActions = useAuthActions({
    user,
    userData,
    onboardingStatus,
    setUserData,
    setOnboardingStatus
  });

  // Initialize security configuration
  useSecurityConfig();

  // Create context value
  const contextValue = useMemo(() => ({
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    ...authActions
  }), [
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    authActions.signInWithGoogle,
    authActions.logout,
    authActions.setUserType,
    authActions.updateOnboardingStep,
    authActions.completeOnboarding
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Named exports
export { useAuth, AuthProvider, AuthContext };
