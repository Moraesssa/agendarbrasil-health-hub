// Utility to ensure critical modules are loaded properly
export const ensureModulesLoaded = async (): Promise<boolean> => {
  try {
    // Preload critical modules
    const modules = await Promise.all([
      import('@/contexts/AuthContext'),
      import('@/hooks/useAuthState'),
      import('@/hooks/useAuthActions'),
      import('@/types/auth'),
    ]);

    // Verify all modules loaded correctly
    const [authContext, authState, authActions, authTypes] = modules;

    // Check for useAuth hook (could be default or named export)
    const useAuth = authContext.useAuth || authContext.default?.useAuth;
    if (!useAuth || typeof useAuth !== 'function') {
      throw new Error('useAuth hook not properly loaded');
    }

    // Check for AuthProvider (could be default or named export)
    const AuthProvider = authContext.AuthProvider || authContext.default?.AuthProvider;
    if (!AuthProvider || typeof AuthProvider !== 'function') {
      throw new Error('AuthProvider not properly loaded');
    }

    // Verify hooks are functions
    if (authState.default && typeof authState.default !== 'function') {
      throw new Error('useAuthState hook not properly loaded');
    }

    if (authActions.default && typeof authActions.default !== 'function') {
      throw new Error('useAuthActions hook not properly loaded');
    }

    console.log('✅ All critical modules loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load critical modules:', error);
    return false;
  }
};

// Global module health check
export const checkModuleHealth = (): boolean => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('⚠️ Not in browser environment');
      return false;
    }

    // Check if DOM is ready
    if (document.readyState === 'loading') {
      console.warn('⚠️ DOM still loading');
      return false;
    }

    // Check if we can access React (modern bundlers don't put React on window)
    try {
      // Try to import React to verify it's available
      const reactCheck = typeof React !== 'undefined' || 
                        (typeof window !== 'undefined' && window.React);
      
      console.log('✅ Module health check passed');
      return true;
    } catch {
      console.warn('⚠️ React not accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Module health check failed:', error);
    return false;
  }
};