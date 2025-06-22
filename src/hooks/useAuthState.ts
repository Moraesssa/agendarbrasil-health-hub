import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'; // Verifique se este caminho está correto
import { BaseUser, OnboardingStatus, UserPreferences } from '@/types/user'; // Verifique se este caminho está correto
import { authService } from '@/services/authService'; // Verifique se este caminho está correto

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  const loadUserData = async (uid: string, retryCount = 0) => {
    try {
      console.log(`Carregando dados para o usuário: ${uid} (tentativa ${retryCount + 1})`);
      
      // A chamada ao seu serviço para buscar o perfil continua a mesma.
      const { profile, shouldRetry, error } = await authService.loadUserProfile(uid);

      if (error) {
        console.error('Erro ao carregar o perfil do usuário:', error);
        setLoading(false);
        return;
      }

      // A lógica de retentativa é uma boa prática e deve ser mantida.
      // Ela dá tempo para o trigger do banco de dados executar.
      if (shouldRetry && retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
        console.log(`Perfil não encontrado, tentando novamente em ${delay}ms...`);
        setTimeout(() => {
          loadUserData(uid, retryCount + 1);
        }, delay);
        return;
      }

      // =================================================================
      // INÍCIO DA CORREÇÃO PRINCIPAL
      // =================================================================

      // Se, após todas as tentativas, o perfil ainda não existir,
      // nós consideramos isso um erro e paramos a execução, em vez de
      // tentar criar um perfil aqui e causar a condição de corrida.
      if (!profile) {
        console.error(
          'ERRO CRÍTICO: O perfil do usuário não foi encontrado no banco de dados, mesmo após várias tentativas. Verifique o trigger "on_auth_user_created" no Supabase.'
        );
        setLoading(false); // Para a tela de carregamento
        return; // Interrompe a função para evitar mais erros
      }
      
      // =================================================================
      // FIM DA CORREÇÃO PRINCIPAL
      // =================================================================

      const finalProfile = profile; // Usamos o perfil que foi encontrado com sucesso.

      // Safely parse preferences with fallback
      const defaultPreferences: UserPreferences = {
        notifications: true,
        theme: 'light',
        language: 'pt-BR'
      };

      let parsedPreferences = defaultPreferences;
      if (finalProfile.preferences && typeof finalProfile.preferences === 'object') {
         try {
           // Simplesmente assumimos que o formato é correto se for um objeto,
           // você pode adicionar validações mais estritas se necessário.
           parsedPreferences = { ...defaultPreferences, ...finalProfile.preferences };
         } catch (e) {
           console.warn('Formato de preferências inválido, usando padrões.');
         }
      }

      // Mapeia os dados do banco (snake_case) para o objeto do app (camelCase)
      const baseUser: BaseUser = {
        uid: finalProfile.id,
        email: finalProfile.email,
        displayName: finalProfile.display_name || '',
        photoURL: finalProfile.photo_url || '',
        userType: finalProfile.user_type, // Será null para novos usuários, o que está correto
        onboardingCompleted: finalProfile.onboarding_completed,
        createdAt: new Date(finalProfile.created_at),
        lastLogin: finalProfile.last_login ? new Date(finalProfile.last_login) : new Date(),
        isActive: finalProfile.is_active,
        preferences: parsedPreferences
      };

      console.log('Dados do usuário definidos com sucesso:', baseUser);
      setUserData(baseUser);
      
      // Carrega o status do onboarding se necessário
      if (!baseUser.onboardingCompleted && baseUser.userType) {
        const totalSteps = baseUser.userType === 'medico' ? 7 : 5; // Exemplo
        setOnboardingStatus({
          currentStep: 2,
          completedSteps: [1],
          totalSteps,
          canProceed: true,
          errors: []
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro inesperado na função loadUserData:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // Pequeno delay para garantir que a sessão foi estabelecida antes de carregar os dados
          setTimeout(() => loadUserData(currentUser.id), 100);
        } else {
          setUserData(null);
          setOnboardingStatus(null);
          setLoading(false);
        }
      }
    );

    // Verificação da sessão inicial (não é mais estritamente necessária com o onAuthStateChange, mas não prejudica)
    supabase.auth.getSession().then(({ data: { session } }) => {
       if (!user && session?.user) { // Apenas executa se o listener ainda não pegou
           console.log("Sessão inicial encontrada.");
           setSession(session);
           setUser(session.user);
           loadUserData(session.user.id);
       } else if (!session) {
           setLoading(false);
       }
    });

    return () => {
      console.log("Limpando a inscrição do AuthState.");
      subscription.unsubscribe();
    };
  }, []); // O array vazio [] garante que este efeito rode apenas uma vez

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