
import { UserType } from '@/types/user';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

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
      console.log('Iniciando login com Google...');
      
      const { error } = await authService.signInWithGoogle();

      if (error) {
        console.error('Erro no login:', error);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
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
      console.error('Erro no logout:', error);
    }
  };

  const setUserType = async (type: UserType) => {
    if (!user) return;

    try {
      console.log('Setting user type:', type);
      
      const { error } = await authService.updateUserType(user.id, type);

      if (error) {
        console.error('Erro ao definir tipo de usuário:', error);
        return;
      }

      // Atualizar o estado local
      if (userData) {
        const updatedUserData = {
          ...userData,
          userType: type,
          onboardingCompleted: false
        };

        setUserData(updatedUserData);
        
        // Atualizar status de onboarding
        const totalSteps = type === 'medico' ? 7 : 5;
        setOnboardingStatus({
          currentStep: 2,
          completedSteps: [1],
          totalSteps,
          canProceed: true,
          errors: []
        });
      }
    } catch (error) {
      console.error('Erro ao definir tipo de usuário:', error);
    }
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
        console.error('Erro ao completar onboarding:', error);
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
      console.error('Erro ao completar onboarding:', error);
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
