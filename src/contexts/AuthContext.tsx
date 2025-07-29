
import React, { createContext, useContext } from 'react';
import { AuthContextType, AuthProviderProps } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useSecurityConfig } from '@/hooks/useSecurityConfig';

// Create context with a default value to avoid undefined issues
const AuthContext = createContext<AuthContextType | null>(null);

// Ensure the hook is defined at module level to prevent bundling issues
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    const error = new Error('useAuth must be used within an AuthProvider');
    console.error('❌ useAuth hook error:', error);
    throw error;
  }
  
  return context;
};

// Immediately verify the hook is properly defined
if (typeof useAuth !== 'function') {
  throw new Error('useAuth hook failed to initialize');
}

const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  try {
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

    const authActions = useAuthActions(
      user,
      userData,
      onboardingStatus,
      setUserData,
      setOnboardingStatus
    );

    // Initialize security configuration
    useSecurityConfig();

    const contextValue: AuthContextType = {
      user,
      session,
      userData,
      loading,
      onboardingStatus,
      ...authActions
    };

    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error('❌ Error in AuthProvider:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            ❌
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro de Autenticação
          </h2>
          <p className="text-gray-600 mb-4">
            Houve um problema ao inicializar o sistema de autenticação.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
};

// Verify AuthProvider is properly defined
if (typeof AuthProvider !== 'function') {
  throw new Error('AuthProvider failed to initialize');
}

// Ensure all exports are properly defined before exporting
if (typeof useAuth !== 'function') {
  throw new Error('useAuth is not properly defined');
}

if (typeof AuthProvider !== 'function') {
  throw new Error('AuthProvider is not properly defined');
}

// Named exports
export { useAuth, AuthProvider, AuthContext };

// Also provide a default export for compatibility
export default { useAuth, AuthProvider, AuthContext };

// Global reference to prevent garbage collection issues
if (typeof window !== 'undefined') {
  (window as any).__useAuth = useAuth;
  (window as any).__AuthProvider = AuthProvider;
  
  // Add a runtime check that can be called from console for debugging
  (window as any).__checkAuthContext = () => {
    console.log('🔍 AuthContext Check:', {
      useAuthDefined: typeof useAuth === 'function',
      AuthProviderDefined: typeof AuthProvider === 'function',
      AuthContextDefined: !!AuthContext,
    });
  };
}
