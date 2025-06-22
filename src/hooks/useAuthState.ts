
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { BaseUser, OnboardingStatus } from '@/types/user';
import { authService } from '@/services/authService';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  const loadUserData = async (uid: string, retryCount = 0) => {
    try {
      console.log(`Loading user data for: ${uid} (attempt ${retryCount + 1})`);
      
      const { profile, shouldRetry, error } = await authService.loadUserProfile(uid);

      if (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
        return;
      }

      if (shouldRetry && retryCount < 5) {
        // Retry up to 5 times with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
        console.log(`Profile not found, retrying in ${delay}ms...`);
        setTimeout(() => {
          loadUserData(uid, retryCount + 1);
        }, delay);
        return;
      }

      // Use let to allow reassignment
      let finalProfile = profile;

      if (!finalProfile) {
        console.log('Profile not found after retries, creating default profile...');
        // If profile still doesn't exist after retries, create a basic one
        // This handles edge cases where the trigger might not have fired
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: uid,
              email: user?.email || '',
              display_name: user?.user_metadata?.full_name || user?.email || '',
              photo_url: user?.user_metadata?.avatar_url || '',
              user_type: 'paciente',
              onboarding_completed: false,
              is_active: true,
              preferences: {
                notifications: true,
                theme: 'light' as const,
                language: 'pt-BR' as const
              }
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            setLoading(false);
            return;
          }

          // Use the newly created profile
          console.log('Created new profile:', newProfile);
          finalProfile = newProfile;
        } catch (createError) {
          console.error('Failed to create profile:', createError);
          setLoading(false);
          return;
        }
      }

      // Safely parse preferences with fallback
      const defaultPreferences = {
        notifications: true,
        theme: 'light' as const,
        language: 'pt-BR' as const
      };

      let parsedPreferences = defaultPreferences;
      if (finalProfile.preferences && typeof finalProfile.preferences === 'object') {
        try {
          const prefs = finalProfile.preferences as any;
          if (typeof prefs.notifications === 'boolean' && 
              (prefs.theme === 'light' || prefs.theme === 'dark') &&
              prefs.language === 'pt-BR') {
            parsedPreferences = prefs;
          }
        } catch (e) {
          console.warn('Invalid preferences format, using defaults');
        }
      }

      const baseUser: BaseUser = {
        uid: finalProfile.id,
        email: finalProfile.email,
        displayName: finalProfile.display_name || '',
        photoURL: finalProfile.photo_url || '',
        userType: finalProfile.user_type as any,
        onboardingCompleted: finalProfile.onboarding_completed,
        createdAt: new Date(finalProfile.created_at),
        lastLogin: finalProfile.last_login ? new Date(finalProfile.last_login) : new Date(),
        isActive: finalProfile.is_active,
        preferences: parsedPreferences
      };

      console.log('Setting userData:', baseUser);
      setUserData(baseUser);
      
      // Load onboarding status if not completed
      if (!baseUser.onboardingCompleted) {
        const totalSteps = baseUser.userType === 'medico' ? 7 : 5;
        setOnboardingStatus({
          currentStep: baseUser.userType ? 2 : 1,
          completedSteps: baseUser.userType ? [1] : [],
          totalSteps,
          canProceed: true,
          errors: []
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load user data when session is available
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 100); // Small delay to ensure trigger has time to execute
        } else {
          setUserData(null);
          setOnboardingStatus(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          loadUserData(session.user.id);
        }, 100);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    setUserData,
    setOnboardingStatus
  };
};
