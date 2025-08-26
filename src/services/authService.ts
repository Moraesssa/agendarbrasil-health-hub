
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
      // Profile doesn't exist yet - try to create it manually as fallback
      logger.warn("Profile not found, attempting to create", "AuthService", { uid });
      
      const createResult = await this.createUserProfile(uid);
      if (createResult.profile) {
        logger.info("Profile created successfully as fallback", "AuthService", { uid });
        return { profile: createResult.profile, shouldRetry: false };
      }
      
      // If creation failed, allow retry
      return { profile: null, shouldRetry: true };
    }

    logger.info("Profile loaded successfully", "AuthService", { 
      uid, 
      userType: profile.user_type,
      onboardingCompleted: profile.onboarding_completed 
    });
    return { profile, shouldRetry: false };
  },

  async createUserProfile(uid: string) {
    logger.info("Creating user profile manually", "AuthService", { uid });
    
    try {
      // Get the authenticated user data first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logger.error("Cannot create profile - user not authenticated", "AuthService", { uid, authError });
        return { profile: null, error: authError || new Error('User not authenticated') };
      }
      
      // Create profile with data from auth user
      const profileData = {
        id: uid,
        email: user.email || '',
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || '',
        photo_url: user.user_metadata?.avatar_url || null,
        user_type: null, // Will be set during onboarding
        onboarding_completed: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();
      
      if (createError) {
        logger.error("Failed to create user profile", "AuthService", { uid, createError });
        return { profile: null, error: createError };
      }
      
      logger.info("User profile created successfully", "AuthService", { uid, profile: newProfile });
      return { profile: newProfile, error: null };
      
    } catch (error) {
      logger.error("Unexpected error creating profile", "AuthService", { uid, error });
      return { profile: null, error };
    }
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
