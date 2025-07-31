import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationError {
  field: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

interface FieldValidationProps {
  error?: ValidationError;
  success?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const FieldValidation = ({ 
  error, 
  success, 
  className, 
  children 
}: FieldValidationProps) => {
  if (!error && !success && !children) return null;

  const getIcon = () => {
    if (success) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (error?.type === 'warning') return <Info className="h-4 w-4 text-amber-600" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getStyles = () => {
    if (success) return "bg-green-50 border-green-200 text-green-800";
    if (error?.type === 'warning') return "bg-amber-50 border-amber-200 text-amber-800";
    if (error) return "bg-red-50 border-red-200 text-red-800";
    return "bg-blue-50 border-blue-200 text-blue-800";
  };

  return (
    <div className={cn(
      "flex items-start gap-2 p-3 border rounded-lg text-sm transition-all duration-200",
      getStyles(),
      className
    )}>
      {getIcon()}
      <div className="flex-1 min-w-0">
        {error && (
          <p className="font-medium">{error.message}</p>
        )}
        {success && (
          <p className="font-medium">Campo preenchido corretamente</p>
        )}
        {children}
      </div>
    </div>
  );
};

interface FieldWrapperProps {
  error?: ValidationError;
  success?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FieldWrapper = ({ 
  error, 
  success, 
  loading, 
  children, 
  className 
}: FieldWrapperProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn(
        "relative transition-all duration-200",
        error && "animate-shake",
        loading && "opacity-70"
      )}>
        {children}
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <FieldValidation error={error} success={success} />
    </div>
  );
};

// Utility function to validate common fields
export const validateField = (field: string, value: any): ValidationError | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      field,
      message: `${field} é obrigatório`,
      type: 'error'
    };
  }
  return null;
};

// Validation for specific scheduling fields
export const validateSchedulingStep = (step: number, data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  switch (step) {
    case 1:
      if (!data.selectedSpecialty) {
        errors.push({
          field: 'specialty',
          message: 'Selecione uma especialidade para continuar',
          type: 'error'
        });
      }
      break;
    
    case 2:
      if (!data.selectedState) {
        errors.push({
          field: 'state',
          message: 'Selecione um estado para continuar',
          type: 'error'
        });
      }
      break;
    
    case 3:
      if (!data.selectedCity) {
        errors.push({
          field: 'city',
          message: 'Selecione uma cidade para continuar',
          type: 'error'
        });
      }
      break;
    
    case 4:
      if (!data.selectedDoctor) {
        errors.push({
          field: 'doctor',
          message: 'Selecione um médico para continuar',
          type: 'error'
        });
      }
      break;
    
    case 5:
      if (!data.selectedDate) {
        errors.push({
          field: 'date',
          message: 'Selecione uma data para continuar',
          type: 'error'
        });
      }
      break;
    
    case 6:
      if (!data.selectedTime) {
        errors.push({
          field: 'time',
          message: 'Selecione um horário para continuar',
          type: 'error'
        });
      }
      break;
  }

  return errors;
};