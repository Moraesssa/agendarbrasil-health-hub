import { useState, useEffect } from 'react';

export const useAuthInitialization = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Simplified initialization - verify AuthContext exports
        const authModule = await import('@/contexts/AuthContext');
        
        // Verify that useAuth is properly exported
        if (typeof authModule.useAuth !== 'function') {
          throw new Error('useAuth is not properly exported from AuthContext');
        }

        // Verify that AuthProvider is properly exported
        if (typeof authModule.AuthProvider !== 'function') {
          throw new Error('AuthProvider is not properly exported from AuthContext');
        }

        setIsAuthReady(true);
      } catch (error) {
        console.error('Failed to initialize AuthContext:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        
        // Attempt to reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    initializeAuth();
  }, []);

  return { isAuthReady, initError };
};