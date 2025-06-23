
// src/components/AuthRedirectController.tsx

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export const AuthRedirectController = ({ children }: { children: ReactNode }) => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  const userType = userData?.userType;
  const onboardingCompleted = userData?.onboardingCompleted;

  // Mostrar mensagem de loading após 2 segundos
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowLoadingMessage(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingMessage(false);
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/', '/login'];
    const isOnboardingRoute = location.pathname.startsWith('/user-type') || location.pathname.startsWith('/onboarding');
    const isPublicRoute = publicRoutes.includes(location.pathname);

    if (user && userData) {
      // Se não tem tipo de usuário definido, vai para seleção
      if (!userType) {
        if (location.pathname !== '/user-type') navigate('/user-type');
        return;
      }
      
      // Se não completou onboarding, vai para onboarding
      if (!onboardingCompleted) {
        if (location.pathname !== '/onboarding') navigate('/onboarding');
        return;
      }

      // Se onboarding está completo, aplicar redirecionamentos específicos
      if (onboardingCompleted) {
        // Médicos não podem acessar a página inicial nem rotas de onboarding/login
        if (userType === 'medico' && (location.pathname === '/' || isOnboardingRoute || location.pathname === '/login')) {
          navigate('/dashboard-medico');
          return;
        }

        // Pacientes podem acessar a página inicial, mas não rotas de onboarding/login
        if (userType === 'paciente' && (isOnboardingRoute || location.pathname === '/login')) {
          navigate('/');
          return;
        }
      }
    } 
    else if (!user && !isPublicRoute) {
      // Se não está logado e tenta acessar rota protegida, vai para login
      navigate('/login');
    }
  }, [user, loading, userType, onboardingCompleted, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Carregando...</h3>
          
          {showLoadingMessage && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Estamos verificando seus dados e preparando tudo para você.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                <h4 className="font-semibold text-blue-900 mb-2">O que está acontecendo:</h4>
                <ul className="text-blue-800 space-y-1">
                  <li>• Verificando seu login</li>
                  <li>• Carregando seus dados</li>
                  <li>• Preparando sua experiência</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Ir para Início
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Recarregar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
