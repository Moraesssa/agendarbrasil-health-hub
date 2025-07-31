import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  completedSteps: number[];
  onStepClick?: (stepNumber: number) => void;
  className?: string;
  errorSteps?: number[];
  loadingStep?: number;
}

export const EnhancedProgressIndicator = ({
  currentStep,
  totalSteps,
  stepTitles,
  completedSteps,
  onStepClick,
  className,
  errorSteps = [],
  loadingStep
}: ProgressIndicatorProps) => {
  const handleStepClick = (stepNumber: number) => {
    // Only allow clicking on completed steps or current step
    if (onStepClick && (completedSteps.includes(stepNumber) || stepNumber <= currentStep)) {
      onStepClick(stepNumber);
    }
  };

  const getStepState = (stepNumber: number) => {
    if (errorSteps.includes(stepNumber)) return 'error';
    if (loadingStep === stepNumber) return 'loading';
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (stepNumber === currentStep) return 'current';
    if (stepNumber < currentStep) return 'completed';
    return 'pending';
  };

  const isClickable = (stepNumber: number) => {
    return completedSteps.includes(stepNumber) || stepNumber <= currentStep;
  };

  return (
    <div className={cn("w-full", className)} role="navigation" aria-label="Progresso do agendamento">
      {/* Screen reader only progress summary */}
      <div className="sr-only">
        <p>Progresso do agendamento: etapa {currentStep} de {totalSteps}</p>
        <p>Etapa atual: {stepTitles[currentStep - 1] || `Passo ${currentStep}`}</p>
        <p>Etapas concluídas: {completedSteps.length}</p>
      </div>
      
      {/* Desktop Progress Indicator */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Progresso: etapa ${currentStep} de ${totalSteps}`}>
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const state = getStepState(stepNumber);
            const clickable = isClickable(stepNumber);
            
            return (
              <React.Fragment key={stepNumber}>
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStepClick(stepNumber)}
                    disabled={!clickable || !onStepClick}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ease-in-out",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                      {
                        // Completed state
                        "bg-green-600 text-white border-green-600 progress-step-completed": state === 'completed',
                        // Current state
                        "bg-blue-600 text-white border-blue-600 progress-step-active": state === 'current',
                        // Error state
                        "bg-red-600 text-white border-red-600 animate-pulse": state === 'error',
                        // Loading state
                        "bg-blue-100 text-blue-600 border-blue-300": state === 'loading',
                        // Pending state
                        "bg-white text-gray-400 border-gray-300": state === 'pending',
                        // Hover states
                        "hover:shadow-md hover:scale-105": clickable && onStepClick && state !== 'loading',
                        "cursor-pointer": clickable && onStepClick && state !== 'loading',
                        "cursor-not-allowed": !clickable || !onStepClick || state === 'loading'
                      }
                    )}
                    aria-label={`${clickable ? 'Ir para' : ''} Etapa ${stepNumber}: ${stepTitles[index] || `Passo ${stepNumber}`}${state === 'completed' ? ' (concluída)' : state === 'current' ? ' (atual)' : state === 'error' ? ' (com erro)' : state === 'loading' ? ' (carregando)' : ''}`}
                    aria-current={state === 'current' ? 'step' : undefined}
                    aria-describedby={`step-${stepNumber}-title`}
                    tabIndex={clickable && onStepClick ? 0 : -1}
                  >
                    {state === 'completed' ? (
                      <Check className="w-5 h-5" aria-hidden="true" />
                    ) : state === 'error' ? (
                      <AlertCircle className="w-5 h-5" aria-hidden="true" />
                    ) : state === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <span className="text-sm font-semibold" aria-hidden="true">{stepNumber}</span>
                    )}
                  </button>
                  
                  {/* Step Title */}
                  <div className="mt-2 text-center">
                    <span 
                      id={`step-${stepNumber}-title`}
                      className={cn(
                        "text-xs font-medium transition-colors duration-200",
                        {
                          "text-green-600": state === 'completed',
                          "text-blue-600": state === 'current',
                          "text-red-600": state === 'error',
                          "text-blue-500": state === 'loading',
                          "text-gray-500": state === 'pending'
                        }
                      )}
                    >
                      {stepTitles[index] || `Passo ${stepNumber}`}
                    </span>
                  </div>
                </div>
                
                {/* Connector Line */}
                {stepNumber < totalSteps && (
                  <div className="flex-1 mx-2" aria-hidden="true">
                    <div className={cn(
                      "h-0.5 transition-colors duration-300",
                      {
                        "bg-green-600": stepNumber < currentStep || completedSteps.includes(stepNumber),
                        "bg-gray-300": stepNumber >= currentStep && !completedSteps.includes(stepNumber)
                      }
                    )} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress Indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div 
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                {
                  "bg-green-600 text-white border-green-600": completedSteps.includes(currentStep),
                  "bg-red-600 text-white border-red-600 animate-pulse": errorSteps.includes(currentStep),
                  "bg-blue-100 text-blue-600 border-blue-300": loadingStep === currentStep,
                  "bg-blue-600 text-white border-blue-600": !completedSteps.includes(currentStep) && !errorSteps.includes(currentStep) && loadingStep !== currentStep,
                }
              )}
              role="img"
              aria-label={`Etapa ${currentStep}: ${
                completedSteps.includes(currentStep) ? 'concluída' :
                errorSteps.includes(currentStep) ? 'com erro' :
                loadingStep === currentStep ? 'carregando' : 'atual'
              }`}
            >
              {completedSteps.includes(currentStep) ? (
                <Check className="w-4 h-4" aria-hidden="true" />
              ) : errorSteps.includes(currentStep) ? (
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
              ) : loadingStep === currentStep ? (
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              ) : (
                <span className="text-xs font-semibold" aria-hidden="true">{currentStep}</span>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {stepTitles[currentStep - 1] || `Passo ${currentStep}`}
              </div>
              <div className="text-xs text-gray-500">
                Etapa {currentStep} de {totalSteps}
              </div>
            </div>
          </div>
          
          {/* Mobile Progress Bar */}
          <div className="flex-1 ml-4">
            <div 
              className="w-full bg-gray-200 rounded-full h-2"
              role="progressbar"
              aria-valuenow={currentStep}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-label={`Progresso: ${Math.round((currentStep / totalSteps) * 100)}% concluído`}
            >
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        
        {/* Mobile Step Dots */}
        <div className="flex justify-center space-x-2" role="tablist" aria-label="Navegação entre etapas">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const state = getStepState(stepNumber);
            const clickable = isClickable(stepNumber);
            
            return (
              <button
                key={stepNumber}
                onClick={() => handleStepClick(stepNumber)}
                disabled={!clickable || !onStepClick || state === 'loading'}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  {
                    "bg-green-600": state === 'completed',
                    "bg-blue-600": state === 'current',
                    "bg-red-600 animate-pulse": state === 'error',
                    "bg-blue-300": state === 'loading',
                    "bg-gray-300": state === 'pending',
                    "cursor-pointer": clickable && onStepClick && state !== 'loading',
                    "cursor-not-allowed": !clickable || !onStepClick || state === 'loading'
                  }
                )}
                role="tab"
                aria-selected={state === 'current'}
                aria-label={`${clickable ? 'Ir para' : ''} Etapa ${stepNumber}: ${stepTitles[index] || `Passo ${stepNumber}`}${state === 'completed' ? ' (concluída)' : state === 'current' ? ' (atual)' : state === 'error' ? ' (com erro)' : state === 'loading' ? ' (carregando)' : ''}`}
                aria-current={state === 'current' ? 'step' : undefined}
                tabIndex={clickable && onStepClick ? 0 : -1}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};