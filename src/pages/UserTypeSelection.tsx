
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import UserTypeNavigation from "@/components/usertype/UserTypeNavigation";
import UserTypeHeader from "@/components/usertype/UserTypeHeader";
import UserTypeCards from "@/components/usertype/UserTypeCards";
import UserTypeHelp from "@/components/usertype/UserTypeHelp";

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const { setUserType } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserTypeSelection = async (type: 'paciente' | 'medico') => {
    setIsSubmitting(true);
    
    try {
      // Await the promise from setUserType. Navigation will only happen if it resolves.
      await setUserType(type);
      
      toast({
        title: `Tipo de usuário definido!`,
        description: `Você foi cadastrado como ${type}. Vamos completar seu perfil.`,
      });
      
      // This navigation is now safe because the user state is guaranteed to be updated.
      navigate("/onboarding");

    } catch (error) {
      // The error toast is now handled inside setUserType, so we just need to log it here.
      console.error('Erro no fluxo de seleção de tipo de usuário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    toast({
      title: "Redirecionando...",
      description: "Voltando para a página de login",
    });
    navigate("/login");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <UserTypeNavigation 
          onBackToLogin={handleBackToLogin}
          onGoHome={handleGoHome}
          isSubmitting={isSubmitting}
        />

        <UserTypeHeader />

        <UserTypeCards 
          onUserTypeSelection={handleUserTypeSelection}
          isSubmitting={isSubmitting}
        />

        <UserTypeHelp />
      </div>
    </div>
  );
};

export default UserTypeSelection;
