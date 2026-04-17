import { useAuth } from '@/contexts/AuthContext';
import { AuthContextType } from '@/types/auth';

// A safer version of useAuth that provides better error handling
export const useSafeAuth = (): AuthContextType => {
  try {
    return useAuth();
  } catch (error) {
    console.error('❌ useSafeAuth error:', error);

    const message = error instanceof Error ? error.message : String(error);
    // If useAuth is not defined, it means there's a module loading issue
    if (message.includes('useAuth is not defined')) {
      console.error('🔥 Critical: useAuth hook is not defined. This is a module loading issue.');
      
      // Force a page reload to fix module loading issues
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    
    throw error;
  }
};

// Export as default for easy replacement
export default useSafeAuth;