
import { UserType, BaseUser, OnboardingStatus } from '@/types/user';
import { User } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface UseAuthActionsProps {
  user: User | null;
  userData: BaseUser | null;
  onboardingStatus: OnboardingStatus | null;
  setUserData: (data: BaseUser | null) => void;
  setOnboardingStatus: (status: OnboardingStatus | null) => void;
}

export const useAuthActions = ({
  user,
  userData,
  onboardingStatus,
  setUserData,
  setOnboardingStatus
}: UseAuthActionsProps) => {
  const { toast } = useToast();

  const signInWithGoogle = async (): Promise<void> => {
    try {
      logger.debug('Iniciando login com Google...', 'useAuthActions');
      
      const { error } = await authService.signInWithGoogle();

      if (error) {
        logger.error('Erro no login', 'useAuthActions', error);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        logger.info('Login Google iniciado com sucesso', 'useAuthActions');
      }
    } catch (error) {
      logger.error('Erro no login', 'useAuthActions', error);
      toast({
        title: "Erro no login",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      logger.info('Logout realizado com sucesso', 'useAuthActions');
    } catch (error) {
      logger.error('Erro no logout', 'useAuthActions', error);
      toast({
        title: "Erro no logout",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const setUserType = (type: UserType): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      if (!user) {
        return reject(new Error("Usuário não autenticado"));
      }

      try {
        logger.debug('Setting user type', 'useAuthActions', { type });

        // 1. Atualiza o tipo de usuário no banco de dados
        const { error: updateError } = await authService.updateUserType(user.id, type);
        if (updateError) {
          throw updateError;
        }

        // 2. Re-busca o perfil completo do banco para garantir consistência
        const { profile: freshProfile, error: fetchError } = await authService.loadUserProfile(user.id);
        if (fetchError) {
          throw fetchError;
        }

        // 3. Atualiza o estado local imediatamente para evitar condições de corrida
        const updatedUserData = {
          ...userData,
          userType: type,
          onboardingCompleted: false
        };

        // 4. Atualiza o estado global com os dados novos e consistentes
        setUserData(updatedUserData);
        
        // 5. Atualiza o estado do onboarding
        const totalSteps = type === 'medico' ? 7 : 5;
        setOnboardingStatus({
          currentStep: 2,
          completedSteps: [1],
          totalSteps,
          canProceed: true,
          errors: []
        });

        // 6. Aguarda um tick para garantir que o estado foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));

        // 7. Resolve a promessa para sinalizar que o fluxo pode continuar
        resolve();

      } catch (error) {
        logger.error('Erro ao definir tipo de usuário', 'useAuthActions', error);
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar sua escolha. Tente novamente.",
          variant: "destructive",
        });
        reject(error);
      }
    });
  };

  const updateOnboardingStep = async (step: number): Promise<void> => {
    if (!onboardingStatus) {
      logger.warn('Tentativa de atualizar step sem onboardingStatus', 'useAuthActions', { step });
      return;
    }

    try {
      const newCompletedSteps = [...onboardingStatus.completedSteps];
      if (!newCompletedSteps.includes(step)) {
        newCompletedSteps.push(step);
      }

      const updatedStatus = {
        ...onboardingStatus,
        currentStep: step + 1,
        completedSteps: newCompletedSteps,
        canProceed: step + 1 <= onboardingStatus.totalSteps
      };

      setOnboardingStatus(updatedStatus);
      logger.debug('Onboarding step atualizado', 'useAuthActions', { step, updatedStatus });
    } catch (error) {
      logger.error('Erro ao atualizar onboarding step', 'useAuthActions', { step, error });
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    if (!user) {
      logger.warn('Tentativa de completar onboarding sem usuário', 'useAuthActions');
      return;
    }

    try {
      logger.debug('Iniciando conclusão do onboarding', 'useAuthActions', { userId: user.id });
      
      const { error } = await authService.completeOnboarding(user.id);

      if (error) {
        logger.error('Erro ao completar onboarding', 'useAuthActions', error);
        toast({
          title: "Erro ao finalizar cadastro",
          description: "Não foi possível concluir seu cadastro. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (userData) {
        const updatedUserData = { ...userData, onboardingCompleted: true };
        setUserData(updatedUserData);
        
        toast({
          title: "Cadastro concluído!",
          description: "Bem-vindo ao AgendarBrasil",
        });
        
        logger.info('Onboarding concluído com sucesso', 'useAuthActions', { userId: user.id });
      }
      
      setOnboardingStatus(null);
    } catch (error) {
      logger.error('Erro ao completar onboarding', 'useAuthActions', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return {
    signInWithGoogle,
    logout,
    setUserType,
    updateOnboardingStep,
    completeOnboarding
  };
};
