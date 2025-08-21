import React from 'react';
import { mockDataService } from '@/services/mockDataService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SupabaseShieldProps {
  children: React.ReactNode;
  operation: string;
  fallbackMessage?: string;
}

export const SupabaseShield = ({ 
  children, 
  operation, 
  fallbackMessage = "Esta operação está desabilitada no modo simulação" 
}: SupabaseShieldProps) => {
  // Se mocks não estão habilitados, renderizar normalmente
  if (!mockDataService.isEnabled()) {
    return <>{children}</>;
  }

  // Se mocks estão habilitados, mostrar aviso em vez de executar operação real
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-700">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>
            <strong>Modo Simulação:</strong> {fallbackMessage} ({operation})
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Hook para verificar se uma operação deve ser bloqueada
export const useSupabaseShield = () => {
  const isShielded = mockDataService.isEnabled();
  
  const shieldOperation = async <T,>(operation: () => Promise<T>, fallbackValue: T): Promise<T> => {
    if (isShielded) {
      console.warn(`🛡️ Supabase operation blocked in mock mode`);
      return Promise.resolve(fallbackValue);
    }
    return operation();
  };

  return {
    isShielded,
    shieldOperation
  };
};