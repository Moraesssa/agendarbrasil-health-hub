
import { useAuth } from "@/contexts/AuthContextV2";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { LoadingFallback } from "@/components/LoadingFallback";
import { ErrorFallback } from "@/components/ErrorFallback";
import { logger } from "@/utils/logger";

const LOADING_TIMEOUT = 15000; // 15 segundos

export const AuthRedirectControllerV2 = ({ children }: { children: ReactNode }) => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTimeout, setShowTimeout] = useState(false);
  const [hasError, setHasError] = useState(false);

  const userType = userData?.userType;
  const onboardingCompleted = userData?.onboardingCompleted;

  const handleRetry = useCallback(() => {
    setHasError(false);
    setShowTimeout(false);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
        logger.warn("Timeout no carregamento da autenticação", "AuthRedirectControllerV2");
      }, LOADING_TIMEOUT);
      
      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    try {
      const publicRoutes = ['/', '/login'];
      const isOnboardingRoute = location.pathname.startsWith('/user-type') || location.pathname.startsWith('/onboarding');
      const isPublicRoute = publicRoutes.includes(location.pathname);

      logger.info("Verificando redirecionamentos", "AuthRedirectControllerV2", {
        hasUser: !!user,
        hasUserData: !!userData,
        userType,
        onboardingCompleted,
        currentPath: location.pathname
      });

      if (user && userData) {
        // Se não tem tipo de usuário definido, vai para seleção
        if (!userType) {
          if (location.pathname !== '/user-type') {
            logger.info("Redirecionando para seleção de tipo de usuário", "AuthRedirectControllerV2");
            navigate('/user-type');
          }
          return;
        }
        
        // Se não completou onboarding, vai para onboarding
        if (!onboardingCompleted) {
          if (location.pathname !== '/onboarding') {
            logger.info("Redirecionando para onboarding", "AuthRedirectControllerV2");
            navigate('/onboarding');
          }
          return;
        }

        // Se onboarding está completo, aplicar redirecionamentos específicos
        if (onboardingCompleted) {
          // Médicos não podem acessar a página inicial, login ou rotas de onboarding
          if (userType === 'medico' && (location.pathname === '/' || isOnboardingRoute || location.pathname === '/login')) {
            logger.info("Redirecionando médico para dashboard", "AuthRedirectControllerV2");
            navigate('/dashboard-medico');
            return;
          }

          // Pacientes podem acessar a página inicial, mas não rotas de onboarding/login
          if (userType === 'paciente' && (isOnboardingRoute || location.pathname === '/login')) {
            logger.info("Redirecionando paciente para início", "AuthRedirectControllerV2");
            navigate('/');
            return;
          }
        }
      } 
      else if (!user && !isPublicRoute) {
        // Se não está logado e tenta acessar rota protegida, vai para login
        logger.info("Redirecionando para login - usuário não autenticado", "AuthRedirectControllerV2");
        navigate('/login');
      }
    } catch (error) {
      logger.error("Erro no controle de redirecionamento", "AuthRedirectControllerV2", error);
      setHasError(true);
    }
  }, [user, userData, loading, userType, onboardingCompleted, navigate, location.pathname]);

  if (hasError) {
    return (
      <ErrorFallback
        title="Erro de Navegação"
        description="Ocorreu um erro no sistema de navegação."
        onRetry={handleRetry}
      />
    );
  }

  if (loading) {
    return (
      <LoadingFallback
        message={showTimeout ? "O carregamento está demorando mais que o esperado..." : "Carregando seus dados..."}
        onRetry={showTimeout ? handleRetry : undefined}
        showRetry={showTimeout}
      />
    );
  }

  return <>{children}</>;
};
