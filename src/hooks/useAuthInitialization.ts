import { useState, useEffect } from 'react';
// import { ensureModulesLoaded, checkModuleHealth } from '@/utils/moduleLoader'; // Temporarily disabled

export const useAuthInitialization = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Simplified initialization - just check if AuthContext exports exist
        // const moduleHealthy = true; // Skip module health check for now
        // const modulesLoaded = true; // Skip module loading check for now

        // Double-check by importing AuthContext again
        const authModule = await import('@/contexts/AuthContext');
        
        // Verify that useAuth is properly exported
        if (typeof authModule.useAuth !== 'function') {
          throw new Error('useAuth is not properly exported from AuthContext');
        }

        // Verify that AuthProvider is properly exported
        if (typeof authModule.AuthProvider !== 'function') {
          throw new Error('AuthProvider is not properly exported from AuthContext');
        }

        console.log('✅ AuthContext initialized successfully');
        setIsAuthReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize AuthContext:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        
        // Attempt to reload the page after a short delay
        setTimeout(() => {
          console.log('🔄 Reloading page due to initialization failure...');
          window.location.reload();
        }, 2000);
      }
    };

    initializeAuth();
  }, []);

  return { isAuthReady, initError };
};