import React, { useRef, useCallback } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar,
  ExternalLink,
  Share2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LocationWithTimeSlots, 
  LocationStatus 
} from '@/types/location';
import { 
  formatPhoneNumber,
  formatAddress,
  getLocationStatusLabel,
  getLocationStatusColor,
  isLocationOpen,
  getDaysSinceUpdate,
  generateMapsUrl,
  generateWhatsAppUrl,
  generateLocationShareMessage
} from '@/utils/locationUtils';
import { 
  generateLocationAriaLabel,
  announceLocationSelection,
  KEYBOARD_KEYS,
  isActivationKey
} from '@/utils/accessibilityUtils';
import { useLocationAccessibility } from '@/hooks/useAccessibility';
import { LocationFacilities } from './LocationFacilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LocationCardProps {
  location: LocationWithTimeSlots;
  isSelected?: boolean;
  onSelect?: () => void;
  onViewMap?: () => void;
  onCall?: () => void;
  onShare?: () => void;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

interface LocationHeaderProps {
  location: LocationWithTimeSlots;
  isSelected?: boolean;
  compact?: boolean;
}

interface LocationInfoProps {
  location: LocationWithTimeSlots;
  compact?: boolean;
}

interface LocationActionsProps {
  location: LocationWithTimeSlots;
  onViewMap?: () => void;
  onCall?: () => void;
  onShare?: () => void;
  compact?: boolean;
}

// Status badge component
const StatusBadge: React.FC<{ status: LocationStatus; isOpen: boolean }> = ({ status, isOpen }) => {
  const getStatusConfig = () => {
    if (status !== 'ativo') {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: getLocationStatusLabel(status)
      };
    }
    
    return isOpen ? {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
      label: 'Aberto'
    } : {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle,
      label: 'Fechado'
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center gap-1 text-xs font-medium", config.color)}
    >
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// Time slots count badge
const TimeSlotsCountBadge: React.FC<{ count: number; compact?: boolean }> = ({ count, compact }) => {
  if (count === 0) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
        <Clock className="h-3 w-3 mr-1" />
        {compact ? '0' : 'Sem horários'}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
      <Clock className="h-3 w-3 mr-1" />
      {compact ? count : `${count} horário${count !== 1 ? 's' : ''}`}
    </Badge>
  );
};

// Location header component
const LocationHeader: React.FC<LocationHeaderProps> = ({ location, isSelected, compact }) => {
  const isOpen = isLocationOpen(location);
  
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-bold text-gray-900 truncate",
          compact ? "text-lg" : "text-xl"
        )}>
          {location.nome_local}
        </h3>
        
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={location.status} isOpen={isOpen} />
            <TimeSlotsCountBadge count={location.available_slots_count} compact={compact} />
          </div>
        )}
      </div>
      
      {compact && (
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={location.status} isOpen={isOpen} />
          <TimeSlotsCountBadge count={location.available_slots_count} compact={true} />
        </div>
      )}
    </div>
  );
};

// Operating hours display
const OperatingHoursDisplay: React.FC<{ location: LocationWithTimeSlots; compact?: boolean }> = ({ 
  location, 
  compact 
}) => {
  const today = new Date();
  const dayName = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][today.getDay()] as keyof typeof location.horario_funcionamento;
  const todayHours = location.horario_funcionamento[dayName];
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="h-4 w-4" />
        <span>
          {todayHours.fechado 
            ? 'Fechado hoje' 
            : `${todayHours.abertura} - ${todayHours.fechamento}`
          }
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-gray-600 cursor-help">
            <Clock className="h-4 w-4" />
            <span>
              Hoje: {todayHours.fechado 
                ? 'Fechado' 
                : `${todayHours.abertura} - ${todayHours.fechamento}`
              }
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">Horários de Funcionamento</div>
            {Object.entries(location.horario_funcionamento).map(([day, hours]) => (
              <div key={day} className="flex justify-between text-sm">
                <span className="capitalize">{day.replace('_', '-')}:</span>
                <span>
                  {hours.fechado 
                    ? 'Fechado' 
                    : `${hours.abertura} - ${hours.fechamento}`
                  }
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Last updated timestamp
const LastUpdatedDisplay: React.FC<{ timestamp: string; compact?: boolean }> = ({ 
  timestamp, 
  compact 
}) => {
  const daysSince = getDaysSinceUpdate(timestamp);
  const isOutdated = daysSince > 7;
  
  const formatRelativeTime = (days: number) => {
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semana${Math.floor(days / 7) !== 1 ? 's' : ''} atrás`;
    return `${Math.floor(days / 30)} mês${Math.floor(days / 30) !== 1 ? 'es' : ''} atrás`;
  };

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs",
      isOutdated ? "text-amber-600" : "text-gray-500"
    )}>
      <Info className="h-3 w-3" />
      <span>
        {compact ? formatRelativeTime(daysSince) : `Atualizado ${formatRelativeTime(daysSince)}`}
      </span>
    </div>
  );
};

// Location info component
const LocationInfo: React.FC<LocationInfoProps> = ({ location, compact }) => {
  return (
    <div className="space-y-3">
      {/* Address */}
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <span className="text-sm text-gray-700 leading-relaxed">
          {formatAddress(location)}
        </span>
      </div>

      {/* Phone */}
      {location.telefone && (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            {formatPhoneNumber(location.telefone)}
          </span>
        </div>
      )}

      {/* Email */}
      {location.email && !compact && (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            {location.email}
          </span>
        </div>
      )}

      {/* Operating Hours */}
      <OperatingHoursDisplay location={location} compact={compact} />

      {/* Last Updated */}
      <LastUpdatedDisplay timestamp={location.ultima_atualizacao} compact={compact} />
    </div>
  );
};

// Location actions component with mobile optimization
const LocationActions: React.FC<LocationActionsProps> = ({ 
  location, 
  onViewMap, 
  onCall, 
  onShare, 
  compact 
}) => {
  const handleViewMap = () => {
    if (onViewMap) {
      onViewMap();
    } else {
      window.open(generateMapsUrl(location), '_blank');
    }
  };

  const handleCall = () => {
    if (onCall) {
      onCall();
    } else if (location.telefone) {
      window.open(`tel:${location.telefone.replace(/\D/g, '')}`);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      const message = generateLocationShareMessage(location);
      if (navigator.share) {
        navigator.share({
          title: location.nome_local,
          text: message,
          url: generateMapsUrl(location)
        });
      } else {
        navigator.clipboard.writeText(message);
      }
    }
  };

  // Use responsive button sizing with CSS classes instead of window.innerWidth
  const buttonSize = compact ? "sm" : "default";

  return (
    <div className={cn(
      "flex gap-2",
      // Mobile-first responsive layout
      "flex-col xs:flex-row",
      // Compact mode overrides
      compact && "flex-col sm:flex-row",
      // Touch-friendly spacing on mobile
      "gap-2 sm:gap-3"
    )}>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={handleViewMap}
        className={cn(
          "flex-1 transition-all duration-200",
          // Enhanced touch targets for mobile
          "min-h-[44px] sm:min-h-[40px]",
          // Better mobile tap feedback
          "active:scale-95 active:bg-blue-50",
          // Improved text sizing for mobile
          "text-sm sm:text-base"
        )}
      >
        <Navigation className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="truncate">
          <span className="sm:hidden">Mapa</span>
          <span className="hidden sm:inline">{compact ? "Mapa" : "Ver no Mapa"}</span>
        </span>
      </Button>

      {location.telefone && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleCall}
          className={cn(
            "flex-1 transition-all duration-200",
            // Enhanced touch targets for mobile
            "min-h-[44px] sm:min-h-[40px]",
            // Better mobile tap feedback
            "active:scale-95 active:bg-green-50",
            // Improved text sizing for mobile
            "text-sm sm:text-base"
          )}
        >
          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">Ligar</span>
        </Button>
      )}

      <Button
        variant="outline"
        size={buttonSize}
        onClick={handleShare}
        className={cn(
          "flex-1 transition-all duration-200",
          // Enhanced touch targets for mobile
          "min-h-[44px] sm:min-h-[40px]",
          // Better mobile tap feedback
          "active:scale-95 active:bg-purple-50",
          // Improved text sizing for mobile
          "text-sm sm:text-base"
        )}
      >
        <Share2 className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="truncate">Compartilhar</span>
      </Button>
    </div>
  );
};

// Main LocationCard component with enhanced responsive design and accessibility
export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected = false,
  onSelect,
  onViewMap,
  onCall,
  onShare,
  compact = false,
  showActions = true,
  className
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { 
    announce, 
    announceError, 
    isHighContrast, 
    reducedMotion, 
    isTouchDevice,
    getAccessibleStyles 
  } = useLocationAccessibility();

  const handleCardClick = useCallback(() => {
    if (onSelect) {
      onSelect();
      // Announce selection to screen readers
      announceLocationSelection(location.nome_local, location.available_slots_count);
    }
  }, [onSelect, location.nome_local, location.available_slots_count]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isActivationKey(e.key)) {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  // Touch event handlers for mobile optimization
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!reducedMotion && isTouchDevice) {
      e.currentTarget.style.transform = 'scale(0.98)';
    }
  }, [reducedMotion, isTouchDevice]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!reducedMotion && isTouchDevice) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, [reducedMotion, isTouchDevice]);

  // Generate comprehensive ARIA label
  const ariaLabel = generateLocationAriaLabel(
    location.nome_local,
    location.available_slots_count,
    location.status,
    isSelected
  );

  return (
    <Card
      ref={cardRef}
      className={cn(
        // Base responsive styles
        "transition-all cursor-pointer",
        "border-2 rounded-xl",
        // Mobile-first responsive design
        "w-full min-h-[280px] sm:min-h-[320px] lg:min-h-[360px]",
        // Touch-friendly spacing on mobile
        "p-1 sm:p-0",
        // Enhanced hover and focus states with accessibility
        "hover:shadow-lg hover:shadow-blue-100/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "focus-within:ring-2 focus-within:ring-blue-300 focus-within:ring-offset-2",
        // Selection states with better mobile visibility
        isSelected 
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl ring-2 ring-blue-200" 
          : "border-gray-200 hover:border-blue-300 bg-white",
        // Status-based styling
        location.status !== 'ativo' && "opacity-75 bg-gray-50",
        // Compact mode adjustments
        compact && "min-h-[240px] sm:min-h-[260px]",
        // High contrast mode support
        isHighContrast && "border-4 border-solid",
        // Reduced motion support
        !reducedMotion && "duration-300",
        className
      )}
      style={getAccessibleStyles}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      aria-describedby={`location-${location.id}-details`}
    >
      <CardHeader className={cn(
        // Responsive padding
        "pb-3 px-4 pt-4 sm:pb-4 sm:px-6 sm:pt-6",
        compact && "pb-2 px-3 pt-3 sm:pb-3 sm:px-4 sm:pt-4"
      )}>
        <LocationHeader 
          location={location} 
          isSelected={isSelected} 
          compact={compact} 
        />
      </CardHeader>

      <CardContent className={cn(
        // Responsive spacing and layout
        "space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6",
        compact && "space-y-2 px-3 pb-3 sm:space-y-3 sm:px-4 sm:pb-4"
      )}>
        {/* Hidden description for screen readers */}
        <div 
          id={`location-${location.id}-details`}
          className="sr-only"
        >
          Estabelecimento {location.nome_local} localizado em {formatAddress(location)}. 
          Status: {getLocationStatusLabel(location.status)}. 
          {location.available_slots_count} horário{location.available_slots_count !== 1 ? 's' : ''} disponível{location.available_slots_count !== 1 ? 'eis' : ''}.
          {location.telefone && ` Telefone: ${formatPhoneNumber(location.telefone)}.`}
          {location.facilidades.length > 0 && ` Facilidades: ${location.facilidades.map(f => f.type).join(', ')}.`}
        </div>

        {/* Location Information */}
        <LocationInfo location={location} compact={compact} />

        {/* Facilities - Responsive display with accessibility */}
        {location.facilidades.length > 0 && (
          <div className="space-y-2">
            <h4 
              className="text-sm font-medium text-gray-900"
              id={`location-${location.id}-facilities-heading`}
            >
              Facilidades
            </h4>
            <LocationFacilities 
              facilities={location.facilidades}
              compact={compact}
              // Responsive max visible items using CSS breakpoints
              maxVisible={compact ? 3 : 8}
              aria-labelledby={`location-${location.id}-facilities-heading`}
            />
          </div>
        )}

        {/* Actions - Mobile-optimized with accessibility */}
        {showActions && (
          <div className={cn(
            "pt-3 border-t border-gray-100",
            // Mobile-specific action layout
            "sm:pt-2"
          )}>
            <LocationActions
              location={location}
              onViewMap={onViewMap}
              onCall={onCall}
              onShare={onShare}
              compact={compact}
            />
          </div>
        )}

        {/* Additional Info for Closed/Maintenance Status with accessibility */}
        {location.status !== 'ativo' && (location.motivo_fechamento || location.previsao_reabertura) && (
          <div 
            className={cn(
              "p-3 bg-amber-50 border border-amber-200 rounded-lg",
              // Mobile-optimized padding
              "p-2 sm:p-3"
            )}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <AlertCircle 
                className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" 
                aria-hidden="true"
              />
              <div className="text-sm min-w-0">
                {location.motivo_fechamento && (
                  <p className="text-amber-800 font-medium break-words">
                    {location.motivo_fechamento}
                  </p>
                )}
                {location.previsao_reabertura && (
                  <p className="text-amber-700 mt-1 break-words">
                    Previsão de reabertura: {location.previsao_reabertura}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Specialized variants
export const LocationCardCompact: React.FC<Omit<LocationCardProps, 'compact'>> = (props) => (
  <LocationCard {...props} compact={true} />
);

export const LocationCardSelectable: React.FC<LocationCardProps> = (props) => (
  <LocationCard 
    {...props} 
    className={cn("hover:bg-blue-25", props.className)}
  />
);

export default LocationCard;