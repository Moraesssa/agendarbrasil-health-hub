
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

  const totalSteps = userData.userType === 'medico' ? 4 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <img 
                  src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
                  alt="AgendarBrasil Logo" 
                  className="w-32 h-32 object-cover rounded-2xl shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl group-hover:shadow-blue-200/30" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-sm transition-all duration-500"></div>
              </div>
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
