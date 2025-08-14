
import { AuthContext } from "@/contexts/AuthContext";
import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export const AuthRedirectController = ({ children }: { children: ReactNode }) => {
  // All hooks must be called at the top level and unconditionally.
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  // Destructure context safely, providing default values.
  const { user, userData, loading } = context || { loading: true };

  useEffect(() => {
    // Guard against running logic if context is not yet available.
    if (!context) return;

    if (loading) {
      const timer = setTimeout(() => setShowLoadingMessage(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingMessage(false);
    }
  }, [loading, context]);

  useEffect(() => {
    // Guard against running logic if context is not ready or still loading.
    if (!context || loading) return;

    const userType = userData?.userType;
    const onboardingCompleted = userData?.onboardingCompleted;
    const publicRoutes = ['/', '/login'];
    const isOnboardingRoute = location.pathname.startsWith('/user-type') || location.pathname.startsWith('/onboarding');
    const isPublicRoute = publicRoutes.includes(location.pathname);

    if (user && userData) {
      if (!userType) {
        if (location.pathname !== '/user-type') navigate('/user-type');
        return;
      }
      
      if (!onboardingCompleted) {
        if (location.pathname !== '/onboarding') navigate('/onboarding');
        return;
      }

      if (onboardingCompleted) {
        if (userType === 'medico' && (location.pathname === '/' || isOnboardingRoute || location.pathname === '/login')) {
          navigate('/dashboard-medico');
        } else if (userType === 'paciente' && (isOnboardingRoute || location.pathname === '/login')) {
          navigate('/');
        }
      }
    } 
    else if (!user && !isPublicRoute) {
      navigate('/login');
    }
  }, [user, userData, loading, navigate, location.pathname, context]);

  // Conditional rendering based on context and loading state.
  if (!context || loading) {
    // Handle the case where context is not present or is loading.
    // The loading UI is only shown if the context exists but is in a loading state.
    if (context && loading) {
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
    // If context is null, render children or a fallback.
    // Here we render children to avoid breaking apps not wrapped in AuthProvider.
    return <>{children}</>;
  }

  return <>{children}</>;
};
