/**
 * ComparisonCriteriaConfig Component
 * Configuração avançada de critérios para comparação de estabelecimentos
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  CheckCircle2, 
  X,
  Info,
  RotateCcw,
  Save,
  Zap,
  Target,
  MapPin,
  Building,
  Clock,
  Phone,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

interface ComparisonCriteria {
  showDistance: boolean;
  showFacilities: boolean;
  showHours: boolean;
  showAvailability: boolean;
  showContact: boolean;
  showRating: boolean;
  priorityFacilities: string[];
  weightings: {
    availability: number;
    distance: number;
    facilities: number;
    hours: number;
    contact: number;
  };
}

interface ComparisonCriteriaConfigProps {
  criteria: ComparisonCriteria;
  onCriteriaChange: (criteria: ComparisonCriteria) => void;
  className?: string;
}

export const ComparisonCriteriaConfig: React.FC<ComparisonCriteriaConfigProps> = ({
  criteria,
  onCriteriaChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempCriteria, setTempCriteria] = useState<ComparisonCriteria>(criteria);

  // Salvar configurações
  const saveConfiguration = () => {
    onCriteriaChange(tempCriteria);
    setIsOpen(false);
    toast({
      title: "Configuração salva!",
      description: "Os critérios de comparação foram atualizados.",
    });
  };

  // Cancelar alterações
  const cancelChanges = () => {
    setTempCriteria(criteria);
    setIsOpen(false);
  };

  // Contar critérios ativos
  const activeCriteriaCount = Object.values(tempCriteria).filter(value => 
    typeof value === 'boolean' && value
  ).length;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={cn("flex items-center gap-2", className)}>
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurar Critérios</span>
            <span className="sm:hidden">Config</span>
            {activeCriteriaCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeCriteriaCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-orange-600" />
              Configurar Critérios de Comparação
            </DialogTitle>
            <DialogDescription>
              Personalize como os estabelecimentos são comparados e pontuados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Critérios Visíveis */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Critérios Visíveis</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-availability"
                    checked={tempCriteria.showAvailability}
                    onCheckedChange={(checked) => 
                      setTempCriteria(prev => ({ ...prev, showAvailability: checked }))
                    }
                  />
                  <Label htmlFor="show-availability" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Disponibilidade
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-distance"
                    checked={tempCriteria.showDistance}
                    onCheckedChange={(checked) => 
                      setTempCriteria(prev => ({ ...prev, showDistance: checked }))
                    }
                  />
                  <Label htmlFor="show-distance" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Distância
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-facilities"
                    checked={tempCriteria.showFacilities}
                    onCheckedChange={(checked) => 
                      setTempCriteria(prev => ({ ...prev, showFacilities: checked }))
                    }
                  />
                  <Label htmlFor="show-facilities" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Facilidades
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-hours"
                    checked={tempCriteria.showHours}
                    onCheckedChange={(checked) => 
                      setTempCriteria(prev => ({ ...prev, showHours: checked }))
                    }
                  />
                  <Label htmlFor="show-hours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horários
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-contact"
                    checked={tempCriteria.showContact}
                    onCheckedChange={(checked) => 
                      setTempCriteria(prev => ({ ...prev, showContact: checked }))
                    }
                  />
                  <Label htmlFor="show-contact" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contato
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2">
            <Button variant="outline" onClick={cancelChanges}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button onClick={saveConfiguration}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ComparisonCriteriaConfig;