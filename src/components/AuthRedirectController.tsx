// src/components/AuthRedirectController.tsx

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

export const AuthRedirectController = ({ children }: { children: ReactNode }) => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userType = userData?.userType;
  const onboardingCompleted = userData?.onboardingCompleted;

  useEffect(() => {
    if (loading) return;

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

      if (onboardingCompleted && (isOnboardingRoute || location.pathname === '/login')) {
        navigate(userType === 'medico' ? '/perfil-medico' : '/perfil');
      }
    } 
    else if (!user && !isPublicRoute) {
      navigate('/login');
    }
  // Depender de valores primitivos é mais estável e evita loops de re-renderização
  }, [user, loading, userType, onboardingCompleted, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
};