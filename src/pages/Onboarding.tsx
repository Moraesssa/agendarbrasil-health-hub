
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Onboarding = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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

    // Aqui seria implementado o fluxo de onboarding específico
    // Por enquanto, vamos simular que o onboarding foi completado
    // Em uma implementação real, haveria múltiplas etapas aqui
    
  }, [userData, navigate]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">A</span>
        </div>
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Configurando seu perfil...</h1>
        <p className="text-gray-600 mb-6">
          Estamos preparando tudo para você como {userData.userType === 'medico' ? 'médico' : 'paciente'}.
        </p>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default Onboarding;
