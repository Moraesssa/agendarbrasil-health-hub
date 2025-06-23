
// src/components/AuthRedirectController.tsx

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

// Este componente age como um "controlador de tráfego" para toda a aplicação.
// Ele verifica o estado do usuário e garante que ele seja redirecionado para
// a página correta com base em seu status (logado, novo, onboarding incompleto, etc.)

export const AuthRedirectController = ({ children }: { children: ReactNode }) => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Não faça nada enquanto os dados de autenticação ainda estão carregando.
    if (loading) {
      return;
    }

    const publicRoutes = ['/', '/login'];
    const isOnboardingRoute = location.pathname.startsWith('/user-type') || location.pathname.startsWith('/onboarding');
    const isPublicRoute = publicRoutes.includes(location.pathname);

    // 2. Se o usuário está logado e já temos os dados do perfil dele...
    if (user && userData) {
      // 2a. Se ele ainda não escolheu um tipo de usuário...
      if (!userData.userType) {
        // ...e não está na página de seleção de tipo, mande-o para lá.
        if (location.pathname !== '/user-type') {
          console.log("Redirecionando para /user-type...");
          navigate('/user-type');
        }
        return;
      }

      // 2b. Se ele já tem um tipo, mas não completou o onboarding...
      if (!userData.onboardingCompleted) {
        // ...e não está na página de onboarding, mande-o para lá.
        if (location.pathname !== '/onboarding') {
          console.log("Redirecionando para /onboarding...");
          navigate('/onboarding');
        }
        return;
      }

      // 2c. Se ele já completou tudo e está tentando acessar uma página de onboarding ou login...
      if (userData.onboardingCompleted && (isOnboardingRoute || location.pathname === '/login')) {
         // ...mande-o para o perfil apropriado.
        console.log("Usuário já completou o onboarding, redirecionando para o perfil...");
        navigate(userData.userType === 'medico' ? '/perfil-medico' : '/perfil');
      }

    } 
    // 3. Se não há usuário logado e ele tenta acessar uma página protegida...
    else if (!user && !isPublicRoute) {
      // ...mande-o para a página de login.
      console.log("Usuário não logado tentando acessar página protegida, redirecionando para /login...");
      navigate('/login');
    }

  }, [user, userData, loading, navigate, location]);

  // Enquanto a lógica de autenticação está rodando, podemos mostrar uma tela de carregamento global
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver carregando, renderiza a página atual solicitada
  return <>{children}</>;
};
