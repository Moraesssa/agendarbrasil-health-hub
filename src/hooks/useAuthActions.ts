
import { UserType } from '@/types/user';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useAuthActions = (
  user: any,
  userData: any,
  onboardingStatus: any,
  setUserData: any,
  setOnboardingStatus: any
) => {
  const { toast } = useToast();

  const signInWithGoogle = async () => {
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

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      logger.error('Erro no logout', 'useAuthActions', error);
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

        // 3. Atualiza o estado global com os dados novos e consistentes
        setUserData(freshProfile);
        
        // 4. Atualiza o estado do onboarding
        const totalSteps = type === 'medico' ? 7 : 5;
        setOnboardingStatus({
          currentStep: 2,
          completedSteps: [1],
          totalSteps,
          canProceed: true,
          errors: []
        });

        // 5. Resolve a promessa para sinalizar que o fluxo pode continuar
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

  const updateOnboardingStep = async (step: number) => {
    if (!onboardingStatus) return;

    const newCompletedSteps = [...onboardingStatus.completedSteps];
    if (!newCompletedSteps.includes(step)) {
      newCompletedSteps.push(step);
    }

    setOnboardingStatus({
      ...onboardingStatus,
      currentStep: step + 1,
      completedSteps: newCompletedSteps,
      canProceed: step + 1 <= onboardingStatus.totalSteps
    });
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await authService.completeOnboarding(user.id);

    if (error) {
      logger.error('Erro ao completar onboarding', 'useAuthActions', error);
        return;
      }

      if (userData) {
        const updatedUserData = { ...userData, onboardingCompleted: true };
        setUserData(updatedUserData);
        
        toast({
          title: "Cadastro concluído!",
          description: "Bem-vindo ao AgendarBrasil",
        });
      }
      setOnboardingStatus(null);
    } catch (error) {
      logger.error('Erro ao completar onboarding', 'useAuthActions', error);
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
