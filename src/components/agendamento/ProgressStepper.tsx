import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
  className?: string;
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                  step.completed && "bg-success text-success-foreground shadow-md",
                  step.current && !step.completed && "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20",
                  !step.completed && !step.current && "bg-muted text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium text-center max-w-[80px]",
                  step.current && "text-primary",
                  step.completed && "text-success",
                  !step.completed && !step.current && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 relative top-[-16px]">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    step.completed ? "bg-success" : "bg-muted"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
