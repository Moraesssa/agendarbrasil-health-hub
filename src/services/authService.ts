
import { supabase } from '@/integrations/supabase/client';
import { BaseUser, UserType } from '@/types/user';
import { logger } from '@/utils/logger';

export const authService = {
  async signInWithGoogle() {
    console.log("🔐 [AuthService] Starting Google sign-in...");
    logger.info("Attempting Google sign-in", "AuthService");
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error("🔐 [AuthService] Google sign-in failed:", error);
      logger.error("Google sign-in failed", "AuthService", error);
    } else {
      console.log("🔐 [AuthService] Google sign-in initiated successfully");
      logger.info("Google sign-in initiated successfully", "AuthService");
    }
    
    return { error };
  },

  async logout() {
    logger.info("Attempting logout", "AuthService");
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error("Logout failed", "AuthService", error);
    } else {
      logger.info("Logout successful", "AuthService");
    }
    
    return { error };
  },

  async loadUserProfile(uid: string) {
    logger.info("Loading user profile", "AuthService", { uid });
    
    // Use maybeSingle() instead of single() to handle cases where profile doesn't exist yet
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      logger.error("Error loading user profile", "AuthService", { uid, error });
      return { profile: null, shouldRetry: false, error };
    }

    if (!profile) {
      // Profile doesn't exist yet - this can happen immediately after signup
      // The trigger should create it, so we can retry a few times
      logger.warn("Profile not found, will retry", "AuthService", { uid });
      return { profile: null, shouldRetry: true };
    }

    logger.info("Profile loaded successfully", "AuthService", { 
      uid, 
      userType: profile.user_type,
      onboardingCompleted: profile.onboarding_completed 
    });
    return { profile, shouldRetry: false };
  },

  async updateUserType(userId: string, type: UserType) {
    logger.info("Updating user type", "AuthService", { userId, type });
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        user_type: type,
        onboarding_completed: false
      })
      .eq('id', userId);

    if (error) {
      logger.error("Failed to update user type", "AuthService", { userId, type, error });
    } else {
      logger.info("User type updated successfully", "AuthService", { userId, type });
    }

    return { error };
  },

  async completeOnboarding(userId: string) {
    logger.info("Completing onboarding", "AuthService", { userId });
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        last_login: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      logger.error("Failed to complete onboarding", "AuthService", { userId, error });
    } else {
      logger.info("Onboarding completed successfully", "AuthService", { userId });
    }

    return { error };
  }
};
