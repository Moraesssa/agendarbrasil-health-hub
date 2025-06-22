
import { supabase } from '@/integrations/supabase/client';
import { BaseUser, UserType } from '@/types/user';

export const authService = {
  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { error };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async loadUserProfile(uid: string) {
    console.log('Loading user profile for:', uid);
    
    // Use maybeSingle() instead of single() to handle cases where profile doesn't exist yet
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Error loading user profile:', error);
      return { profile: null, shouldRetry: false, error };
    }

    if (!profile) {
      // Profile doesn't exist yet - this can happen immediately after signup
      // The trigger should create it, so we can retry a few times
      console.log('Profile not found, will retry...');
      return { profile: null, shouldRetry: true };
    }

    console.log('Profile loaded successfully:', profile);
    return { profile, shouldRetry: false };
  },

  async updateUserType(userId: string, type: UserType) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        user_type: type,
        onboarding_completed: false
      })
      .eq('id', userId);

    return { error };
  },

  async completeOnboarding(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        last_login: new Date().toISOString()
      })
      .eq('id', userId);

    return { error };
  }
};
