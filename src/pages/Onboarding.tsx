
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserTypeSelection } from "./UserTypeSelection";

const Onboarding = () => {
  const { userData, onboardingStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }

    if (userData.onboardingCompleted) {
      // Usuário já completou onboarding, redirecionar para dashboard
      if (userData.userType === 'medico') {
        navigate("/dashboard-medico");
      } else {
        navigate("/");
      }
      return;
    }

    // Se não definiu tipo de usuário ainda, mostrar seleção
    if (!onboardingStatus) {
      // Vai mostrar UserTypeSelection
      return;
    }

    // Redirecionar para etapa específica do onboarding baseado no tipo
    const currentStep = onboardingStatus.currentStep;
    
    if (userData.userType === 'medico') {
      navigate(`/onboarding/medico/${currentStep}`);
    } else {
      navigate(`/onboarding/paciente/${currentStep}`);
    }
  }, [userData, onboardingStatus, navigate]);

  // Se não tem userData ou já completou onboarding, vai redirecionar
  if (!userData || userData.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Se não tem onboarding status, mostrar seleção de tipo
  if (!onboardingStatus) {
    return <UserTypeSelection />;
  }

  return null;
};

export default Onboarding;
