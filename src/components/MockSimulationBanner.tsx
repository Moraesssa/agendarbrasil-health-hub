import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, SkipForward, UserX, Settings } from 'lucide-react';
import { mockDataService } from '@/services/mockDataService';
import { useAuth } from '@/contexts/AuthContext';

interface MockSimulationBannerProps {
  onShowControls?: () => void;
}

export const MockSimulationBanner = ({ onShowControls }: MockSimulationBannerProps) => {
  const { user } = useAuth();
  
  if (!mockDataService.isEnabled()) {
    return null;
  }

  const currentPatient = mockDataService.getCurrentPatient();
  const nextPatient = () => {
    const next = mockDataService.getNextPatient();
    window.location.reload();
  };

  const disableMocks = () => {
    mockDataService.disableMocks();
    window.location.reload();
  };

  return (
    <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mb-6">
      <Play className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              🎭 MODO SIMULAÇÃO ATIVO
            </Badge>
            {currentPatient && (
              <span className="text-sm text-orange-700">
                Usuário: <strong>{currentPatient.display_name}</strong> ({currentPatient.cidade}/{currentPatient.estado})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={nextPatient}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Próximo
            </Button>
            
            {onShowControls && (
              <Button
                size="sm"
                variant="outline"
                onClick={onShowControls}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                Controles
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={disableMocks}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <UserX className="h-3 w-3 mr-1" />
              Desativar
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};