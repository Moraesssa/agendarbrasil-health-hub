import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecurityConfig = () => {
  useEffect(() => {
    // Configure session timeout handling
    const checkSessionTimeout = () => {
      const session = supabase.auth.getSession();
      session.then(({ data: { session } }) => {
        if (session) {
          const now = new Date().getTime();
          const sessionTime = new Date(session.user.last_sign_in_at || '').getTime();
          const timeout = 24 * 60 * 60 * 1000; // 24 hours
          
          if (now - sessionTime > timeout) {
            console.log('Session expired, signing out...');
            supabase.auth.signOut();
          }
        }
      });
    };

    // Check session timeout every 5 minutes
    const interval = setInterval(checkSessionTimeout, 5 * 60 * 1000);
    
    // Check immediately on mount
    checkSessionTimeout();

    return () => clearInterval(interval);
  }, []);

  // Configure security headers for requests
  const configureSecurityHeaders = () => {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  };

  return {
    configureSecurityHeaders
  };
};