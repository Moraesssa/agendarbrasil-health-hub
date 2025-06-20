
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingSteps } from "@/components/onboarding/OnboardingSteps";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

const Onboarding = () => {
  const { userData, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (loading) return;

    if (!userData) {
      navigate("/login");
      return;
    }

    // Se não tem tipo de usuário, redirecionar para seleção
    if (!userData.userType) {
      navigate("/user-type");
      return;
    }

    if (userData.onboardingCompleted) {
      // Usuário já completou onboarding, redirecionar para perfil
      if (userData.userType === 'medico') {
        navigate("/perfil-medico");
      } else {
        navigate("/perfil");
      }
      return;
    }
  }, [userData, loading, navigate]);

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const totalSteps = userData.userType === 'medico' ? 5 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              Complete seu cadastro
            </h1>
            <p className="text-gray-600">
              {userData.userType === 'medico' 
                ? 'Configure seu perfil médico para começar a atender pacientes' 
                : 'Configure seu perfil para agendar consultas'
              }
            </p>
          </div>

          {/* Progress */}
          <OnboardingProgress 
            currentStep={currentStep} 
            totalSteps={totalSteps}
            userType={userData.userType}
          />

          {/* Steps */}
          <OnboardingSteps
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            userType={userData.userType}
            totalSteps={totalSteps}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
