
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      // Se perfil não existe, aguardar um pouco e tentar novamente (trigger pode estar processando)
      if (error.code === 'PGRST116') {
        return { profile: null, shouldRetry: true };
      }
      return { profile: null, shouldRetry: false, error };
    }

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
