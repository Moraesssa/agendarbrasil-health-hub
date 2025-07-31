import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NavigationHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBackClick: () => void;
  canGoBack: boolean;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
}

export const NavigationHeader = ({
  currentStep,
  totalSteps,
  onBackClick,
  canGoBack,
  isLoading = false,
  hasUnsavedChanges = false
}: NavigationHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleHomeClick = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Deseja realmente sair?'
      );
      if (!confirmed) return;
    }

    try {
      setIsNavigating(true);
      navigate('/');
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Erro de navegação",
        description: "Não foi possível voltar ao início. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsNavigating(false);
    }
  };

  const handleBackClick = async () => {
    try {
      setIsNavigating(true);
      onBackClick();
    } catch (error) {
      console.error('Back navigation error:', error);
      toast({
        title: "Erro de navegação",
        description: "Não foi possível voltar à etapa anterior.",
        variant: "destructive"
      });
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <header 
      className="nav-header fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200"
      role="banner"
      aria-label="Navegação do agendamento"
    >
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <nav className="flex items-center justify-between" role="navigation" aria-label="Navegação principal">
          {/* Left side - Back button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                disabled={isLoading || isNavigating}
                className="btn-enhanced-hover flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 min-w-0 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                aria-label={`Voltar para a etapa ${currentStep - 1} de ${totalSteps}`}
                aria-describedby={hasUnsavedChanges ? "unsaved-changes-warning" : undefined}
              >
                {isNavigating ? (
                  <div 
                    className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="hidden xs:inline text-sm">
                  {isNavigating ? 'Voltando...' : 'Voltar'}
                </span>
              </Button>
            )}
          </div>

          {/* Center - Progress info */}
          <div 
            className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 px-2"
            role="status"
            aria-live="polite"
            aria-label={`Progresso do agendamento: etapa ${currentStep} de ${totalSteps}`}
          >
            <span className="hidden md:inline">Agendamento</span>
            <span className="text-blue-600 font-medium whitespace-nowrap">
              {currentStep}/{totalSteps}
            </span>
          </div>

          {/* Right side - Home button */}
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <div 
                className="flex items-center space-x-1 text-amber-600"
                id="unsaved-changes-warning"
                role="status"
                aria-live="polite"
                aria-label="Há alterações não salvas"
              >
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline text-xs">Não salvo</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHomeClick}
              disabled={isLoading || isNavigating}
              className="btn-enhanced-hover flex items-center space-x-1 sm:space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 min-w-0 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              aria-label="Voltar ao início do sistema"
              aria-describedby={hasUnsavedChanges ? "unsaved-changes-warning" : undefined}
            >
              {isNavigating ? (
                <div 
                  className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Home className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              )}
              <span className="hidden xs:inline text-sm">
                {isNavigating ? 'Saindo...' : 'Início'}
              </span>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};