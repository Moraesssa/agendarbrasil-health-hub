// src/hooks/useAuthState.ts

import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { BaseUser, OnboardingStatus, UserPreferences } from '@/types/user';
import { authService } from '@/services/authService';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  // Usamos um ref para evitar chamadas duplicadas ao carregar os dados
  const loadingUserRef = useRef<string | null>(null);

  const loadUserData = async (uid: string, retryCount = 0) => {
    // Se já estamos carregando dados para este usuário, não faça nada.
    if (loadingUserRef.current === uid) return;
    loadingUserRef.current = uid;
    
    console.log(`🔄 Tentativa ${retryCount + 1}/5 - Carregando dados do usuário: ${uid}`);
    
    const { profile, shouldRetry, error } = await authService.loadUserProfile(uid);

    if (error) {
      console.error('Erro ao carregar o perfil do usuário:', error);
      setLoading(false);
      loadingUserRef.current = null;
      return;
    }

    if (shouldRetry && retryCount < 5) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Perfil não encontrado, tentando novamente em ${delay}ms...`);
      setTimeout(() => {
        loadingUserRef.current = null; // Libera para a próxima tentativa
        loadUserData(uid, retryCount + 1);
      }, delay);
      return;
    }

    if (!profile) {
      console.error('ERRO CRÍTICO: Perfil não foi criado pelo trigger após todas as tentativas.');
      setLoading(false);
      loadingUserRef.current = null;
      return;
    }

    let roleData = {};
    if (profile.user_type === 'medico') {
      // Após carregar o perfil, buscamos os dados específicos do médico
      const { data: medicoData, error: medicoError } = await supabase
        .from('medicos')
        .select('especialidades')
        .eq('user_id', uid)
        .single();
      
      if (medicoError) {
        console.error("Erro ao buscar dados do médico:", medicoError);
      } else if (medicoData) {
        roleData = medicoData;
      }
    }

    console.log('✅ Perfil carregado com sucesso:', profile);
    const baseUser: BaseUser = {
      uid: profile.id,
      email: profile.email,
      displayName: profile.display_name || '',
      photoURL: profile.photo_url || '',
      userType: profile.user_type,
      onboardingCompleted: profile.onboarding_completed,
      createdAt: new Date(profile.created_at),
      lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
      isActive: profile.is_active,
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'pt-BR',
        ...profile.preferences,
      },
      ...roleData,
    };

    console.log('🎯 UserData definido:', { 
        userType: baseUser.userType, 
        onboardingCompleted: baseUser.onboardingCompleted,
        displayName: baseUser.displayName 
    });
    setUserData(baseUser);
    
    setLoading(false);
    loadingUserRef.current = null;
  };

  useEffect(() => {
    console.log("🚀 Iniciando AuthState...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔔 Auth state mudou: ${event}`, !!session?.user);
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_IN' && currentUser) {
          loadUserData(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
          setUserData(null);
          setOnboardingStatus(null);
          setLoading(false);
        }
      }
    );

    // Verificação da sessão inicial
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            console.log("🔑 Sessão inicial encontrada");
            setSession(session);
            setUser(session.user);
            loadUserData(session.user.id);
        } else {
            setLoading(false);
        }
    });

    return () => {
      console.log("🧹 Limpando a inscrição do AuthState.");
      subscription.unsubscribe();
    };
  }, []);

  return {
    user, session, userData, loading, onboardingStatus, setUserData, setOnboardingStatus
  };
};