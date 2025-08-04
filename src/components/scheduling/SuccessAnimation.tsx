import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const SuccessAnimation = ({ 
  show, 
  message = "Concluído!", 
  duration = 2000,
  onComplete,
  className 
}: SuccessAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm",
      "transition-opacity duration-300",
      isAnimating ? "opacity-100" : "opacity-0",
      className
    )}>
      <div className={cn(
        "bg-white rounded-2xl p-8 shadow-2xl border border-green-200",
        "transform transition-all duration-500 ease-out",
        isAnimating ? "scale-100 rotate-0" : "scale-95 rotate-3"
      )}>
        <div className="text-center space-y-4">
          {/* Success Icon with Animation */}
          <div className="relative mx-auto w-16 h-16">
            <div className={cn(
              "absolute inset-0 bg-green-100 rounded-full",
              "transform transition-all duration-700 ease-out",
              isAnimating ? "scale-100" : "scale-0"
            )} />
            <div className={cn(
              "absolute inset-2 bg-green-500 rounded-full flex items-center justify-center",
              "transform transition-all duration-500 delay-200 ease-out",
              isAnimating ? "scale-100" : "scale-0"
            )}>
              <CheckCircle2 className={cn(
                "h-8 w-8 text-white",
                "transform transition-all duration-300 delay-500",
                isAnimating ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )} />
            </div>
            
            {/* Sparkle Effects */}
            {[...Array(6)].map((_, i) => (
              <Sparkles
                key={i}
                className={cn(
                  "absolute h-3 w-3 text-green-400",
                  "transform transition-all duration-1000 ease-out",
                  isAnimating ? "opacity-100" : "opacity-0"
                )}
                style={{
                  top: `${Math.sin((i * Math.PI) / 3) * 30 + 30}px`,
                  left: `${Math.cos((i * Math.PI) / 3) * 30 + 30}px`,
                  transitionDelay: `${600 + i * 100}ms`,
                  transform: isAnimating 
                    ? `translate(${Math.cos((i * Math.PI) / 3) * 10}px, ${Math.sin((i * Math.PI) / 3) * 10}px) scale(1)` 
                    : 'translate(0, 0) scale(0)'
                }}
              />
            ))}
          </div>

          {/* Success Message */}
          <div className={cn(
            "transform transition-all duration-500 delay-700 ease-out",
            isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              {message}
            </h3>
            <p className="text-sm text-green-600">
              Etapa concluída com sucesso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepCompletionProps {
  stepNumber: number;
  stepTitle: string;
  show: boolean;
  onComplete?: () => void;
}

export const StepCompletion = ({ 
  stepNumber, 
  stepTitle, 
  show, 
  onComplete 
}: StepCompletionProps) => {
  return (
    <SuccessAnimation
      show={show}
      message={`Etapa ${stepNumber} Concluída`}
      duration={1500}
      onComplete={onComplete}
    >
      <div className="mt-2 text-center">
        <p className="text-sm text-gray-600">{stepTitle}</p>
      </div>
    </SuccessAnimation>
  );
};

// Inline success indicator for form fields
interface InlineSuccessProps {
  show: boolean;
  message?: string;
  className?: string;
}

export const InlineSuccess = ({ 
  show, 
  message = "Selecionado", 
  className 
}: InlineSuccessProps) => {
  if (!show) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-green-600 text-sm font-medium",
      "animate-in fade-in-0 slide-in-from-left-2 duration-300",
      className
    )}>
      <CheckCircle2 className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
};