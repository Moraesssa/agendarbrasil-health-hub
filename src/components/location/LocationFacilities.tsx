import React from 'react';
import { 
  ParkingCircle, 
  Accessibility, 
  Pill, 
  TestTube, 
  Wifi, 
  Wind,
  MoveVertical,
  Coffee,
  Baby,
  Circle,
  Info,
  DollarSign,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LocationFacility, 
  FacilityType, 
  CostType 
} from '@/types/location';
import { 
  getFacilityLabel, 
  getFacilityIcon,
  getAvailableFacilities 
} from '@/utils/locationUtils';
import { generateFacilityAriaLabel } from '@/utils/accessibilityUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icon mapping for facilities
const facilityIcons: Record<FacilityType, React.ComponentType<any>> = {
  estacionamento: ParkingCircle,
  acessibilidade: Accessibility,
  farmacia: Pill,
  laboratorio: TestTube,
  wifi: Wifi,
  ar_condicionado: Wind,
  elevador: MoveVertical,
  cafe: Coffee,
  banheiro_adaptado: Accessibility,
  sala_espera_criancas: Baby,
};

// Cost type colors and labels
const costTypeConfig: Record<CostType, { color: string; label: string; icon: React.ComponentType<any> }> = {
  gratuito: { color: 'text-green-600', label: 'Gratuito', icon: CheckCircle2 },
  pago: { color: 'text-amber-600', label: 'Pago', icon: DollarSign },
  nao_informado: { color: 'text-gray-500', label: 'Não informado', icon: Info },
};

interface LocationFacilitiesProps {
  facilities: LocationFacility[];
  showUnavailable?: boolean;
  compact?: boolean;
  maxVisible?: number;
  className?: string;
}

interface FacilityBadgeProps {
  facility: LocationFacility;
  compact?: boolean;
}

const FacilityBadge: React.FC<FacilityBadgeProps> = ({ facility, compact = false }) => {
  const IconComponent = facilityIcons[facility.type] || Circle;
  const label = getFacilityLabel(facility.type);
  const costConfig = facility.cost ? costTypeConfig[facility.cost] : null;
  
  // Generate comprehensive ARIA label
  const ariaLabel = generateFacilityAriaLabel(
    label,
    facility.available,
    facility.cost,
    facility.details
  );
  
  const badgeContent = (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200",
        "hover:shadow-md hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        facility.available
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-gray-50 border-gray-200 text-gray-500",
        compact && "px-2 py-1 text-xs"
      )}
      role="listitem"
      tabIndex={0}
      aria-label={ariaLabel}
    >
      <IconComponent 
        className={cn(
          "flex-shrink-0",
          compact ? "h-3 w-3" : "h-4 w-4",
          facility.available ? "text-green-600" : "text-gray-400"
        )}
        aria-hidden="true"
      />
      
      {!compact && (
        <span className="font-medium text-sm">
          {label}
        </span>
      )}
      
      {facility.cost && costConfig && !compact && (
        <div className="flex items-center gap-1">
          <costConfig.icon className="h-3 w-3" />
          <span className={cn("text-xs", costConfig.color)}>
            {costConfig.label}
          </span>
        </div>
      )}
      
      {!facility.available && (
        <XCircle className="h-3 w-3 text-red-500" aria-hidden="true" />
      )}
    </div>
  );

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold">{label}</div>
      
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-sm",
          facility.available ? "text-green-600" : "text-red-600"
        )}>
          {facility.available ? "✓ Disponível" : "✗ Indisponível"}
        </span>
      </div>
      
      {facility.cost && costConfig && (
        <div className="flex items-center gap-2">
          <costConfig.icon className="h-3 w-3" />
          <span className={cn("text-sm", costConfig.color)}>
            {costConfig.label}
          </span>
        </div>
      )}
      
      {facility.details && (
        <div className="text-sm text-gray-600 border-t pt-2">
          <strong>Detalhes:</strong> {facility.details}
        </div>
      )}
      
      {facility.observacoes && (
        <div className="text-sm text-gray-600">
          <strong>Observações:</strong> {facility.observacoes}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const LocationFacilities: React.FC<LocationFacilitiesProps> = ({
  facilities,
  showUnavailable = false,
  compact = false,
  maxVisible,
  className,
  ...props
}) => {
  // Filter facilities based on availability
  const displayFacilities = showUnavailable 
    ? facilities 
    : facilities.filter(facility => facility.available);
  
  // Limit visible facilities if maxVisible is set
  const visibleFacilities = maxVisible 
    ? displayFacilities.slice(0, maxVisible)
    : displayFacilities;
  
  const hiddenCount = displayFacilities.length - visibleFacilities.length;
  
  if (displayFacilities.length === 0) {
    return (
      <div 
        className={cn("text-sm text-gray-500 italic", className)}
        role="status"
        aria-label="Nenhuma facilidade informada"
      >
        Nenhuma facilidade informada
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Facilities Grid */}
      <div 
        className={cn(
          "flex flex-wrap gap-2",
          compact && "gap-1"
        )}
        role="list"
        aria-label={`Facilidades disponíveis: ${displayFacilities.length} facilidade${displayFacilities.length !== 1 ? 's' : ''}`}
        {...props}
      >
        {visibleFacilities.map((facility, index) => (
          <div key={`${facility.type}-${index}`} role="listitem">
            <FacilityBadge facility={facility} compact={compact} />
          </div>
        ))}
        
        {/* Show "more" indicator if there are hidden facilities */}
        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-2 rounded-full",
                    "bg-blue-50 border border-blue-200 text-blue-700",
                    "text-sm font-medium cursor-help",
                    compact && "px-2 py-1 text-xs"
                  )}
                  role="button"
                  tabIndex={0}
                  aria-label={`Mais ${hiddenCount} facilidades`}
                >
                  <Info className={cn("h-4 w-4", compact && "h-3 w-3")} />
                  <span>+{hiddenCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-semibold">Facilidades adicionais:</div>
                  {displayFacilities.slice(maxVisible).map((facility, index) => (
                    <div key={index} className="text-sm">
                      • {getFacilityLabel(facility.type)}
                      {facility.cost && ` (${costTypeConfig[facility.cost].label})`}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Summary for screen readers */}
      <div className="sr-only">
        <span>
          {displayFacilities.length} facilidade{displayFacilities.length !== 1 ? 's' : ''} disponível
          {displayFacilities.length !== 1 ? 'eis' : ''}: {' '}
          {displayFacilities.map(f => getFacilityLabel(f.type)).join(', ')}
        </span>
      </div>
    </div>
  );
};

// Specialized components for common use cases
export const LocationFacilitiesCompact: React.FC<Omit<LocationFacilitiesProps, 'compact'>> = (props) => (
  <LocationFacilities {...props} compact={true} maxVisible={6} />
);

export const LocationFacilitiesGrid: React.FC<LocationFacilitiesProps> = (props) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    <LocationFacilities {...props} />
  </div>
);

// Hook for facility filtering
export const useFacilityFilter = (facilities: LocationFacility[]) => {
  const [selectedTypes, setSelectedTypes] = React.useState<FacilityType[]>([]);
  const [showUnavailable, setShowUnavailable] = React.useState(false);
  
  const filteredFacilities = React.useMemo(() => {
    let filtered = facilities;
    
    if (!showUnavailable) {
      filtered = filtered.filter(f => f.available);
    }
    
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(f => selectedTypes.includes(f.type));
    }
    
    return filtered;
  }, [facilities, selectedTypes, showUnavailable]);
  
  const availableTypes = React.useMemo(() => {
    return Array.from(new Set(facilities.map(f => f.type)));
  }, [facilities]);
  
  return {
    filteredFacilities,
    selectedTypes,
    setSelectedTypes,
    showUnavailable,
    setShowUnavailable,
    availableTypes
  };
};

export default LocationFacilities;