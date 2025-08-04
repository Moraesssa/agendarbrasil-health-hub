import React, { useCallback } from 'react';
import { Clock, Building, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  generateTimeSlotAriaLabel,
  announceTimeSlotSelection,
  isActivationKey
} from '@/utils/accessibilityUtils';
import { useLocationAccessibility } from '@/hooks/useAccessibility';

interface TimeSlotButtonProps {
  time: string;
  available: boolean;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  locationId?: string;
  locationName?: string;
  showLocationBadge?: boolean;
  isLocationFiltered?: boolean;
  className?: string;
}

// Color mapping for different locations
const getLocationColor = (locationId: string): string => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200', 
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-teal-100 text-teal-800 border-teal-200',
  ];
  
  // Simple hash function to consistently assign colors
  let hash = 0;
  for (let i = 0; i < locationId.length; i++) {
    hash = ((hash << 5) - hash + locationId.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get button styling based on location
const getLocationButtonStyle = (locationId: string, selected: boolean): string => {
  if (selected) {
    return "border-orange-500 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 shadow-lg ring-2 ring-orange-300";
  }
  
  const locationColors = {
    'location-1': 'hover:border-blue-300 hover:bg-blue-50',
    'location-2': 'hover:border-green-300 hover:bg-green-50',
    'location-3': 'hover:border-purple-300 hover:bg-purple-50',
    'location-4': 'hover:border-pink-300 hover:bg-pink-50',
    'location-5': 'hover:border-indigo-300 hover:bg-indigo-50',
    'location-6': 'hover:border-teal-300 hover:bg-teal-50',
  };
  
  // Simple hash to assign consistent colors
  let hash = 0;
  for (let i = 0; i < locationId.length; i++) {
    hash = ((hash << 5) - hash + locationId.charCodeAt(i)) & 0xffffffff;
  }
  const colorKeys = Object.keys(locationColors);
  const colorKey = colorKeys[Math.abs(hash) % colorKeys.length] as keyof typeof locationColors;
  
  return locationColors[colorKey] || 'hover:border-orange-300 hover:bg-orange-50';
};

export const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  time,
  available,
  selected,
  disabled = false,
  onClick,
  locationId,
  locationName,
  showLocationBadge = false,
  isLocationFiltered = false,
  className
}) => {
  const isDisabled = disabled || !available || (isLocationFiltered && locationId !== undefined);
  
  const { 
    reducedMotion, 
    isTouchDevice,
    getAccessibleStyles 
  } = useLocationAccessibility();

  // Handle click with accessibility announcements
  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onClick();
      // Announce selection to screen readers
      announceTimeSlotSelection(time, locationName);
    }
  }, [onClick, isDisabled, time, locationName]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isActivationKey(e.key) && !isDisabled) {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick, isDisabled]);
  
  // Touch event handlers for mobile feedback
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isDisabled && !reducedMotion && isTouchDevice) {
      e.currentTarget.style.transform = 'scale(0.95)';
    }
  }, [isDisabled, reducedMotion, isTouchDevice]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDisabled && !reducedMotion && isTouchDevice) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, [isDisabled, reducedMotion, isTouchDevice]);

  // Generate comprehensive ARIA label
  const ariaLabel = generateTimeSlotAriaLabel(time, available, locationName, selected);
  
  const buttonContent = (
    <Button
      variant="outline"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={isDisabled}
      className={cn(
        // Mobile-optimized dimensions and touch targets
        "h-16 sm:h-14 flex flex-col items-center justify-center gap-1 border-2 relative",
        "min-w-[64px] sm:min-w-[56px]", // Ensure minimum touch target size
        // Enhanced mobile interactions with reduced motion support
        "hover:shadow-md active:scale-95",
        !reducedMotion && "transition-all duration-200 hover:scale-105",
        "touch-manipulation", // Optimize for touch
        // Enhanced focus states for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        // Disabled states
        !available && "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 line-through",
        isLocationFiltered && locationId && "opacity-60 cursor-not-allowed",
        // Available states
        available && !selected && !isLocationFiltered && "border-gray-200 bg-white",
        // Location-specific styling
        available && !selected && locationId && !isLocationFiltered && getLocationButtonStyle(locationId, false),
        // Selected state with enhanced mobile visibility
        selected && available && cn(
          "border-orange-500 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800",
          "shadow-lg ring-2 ring-orange-300",
          // Enhanced selected state for mobile
          "ring-offset-1 shadow-orange-200/50"
        ),
        className
      )}
      style={getAccessibleStyles}
      aria-label={ariaLabel}
      aria-pressed={selected}
      aria-disabled={isDisabled}
      role="button"
    >
      {/* Location Badge - Mobile Optimized */}
      {showLocationBadge && locationId && locationName && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs px-1.5 py-0.5 h-5 min-w-5 flex items-center justify-center",
              // Mobile-optimized badge
              "sm:h-4 sm:min-w-4 sm:px-1 sm:py-0.5",
              getLocationColor(locationId)
            )}
          >
            <Building className={cn(
              "h-3 w-3 sm:h-2.5 sm:w-2.5"
            )} />
          </Badge>
        </div>
      )}

      {/* Clock Icon - Responsive sizing */}
      <Clock className={cn(
        "h-5 w-5 sm:h-4 sm:w-4",
        selected && available ? "text-orange-600" : "text-gray-500"
      )} />
      
      {/* Time Display - Mobile optimized */}
      <span className={cn(
        "font-semibold",
        "text-sm sm:text-sm", // Consistent sizing
        // Better contrast for mobile
        selected && available ? "text-orange-800" : "text-gray-700"
      )}>
        {time}
      </span>
      
      {/* Selected Indicator - Mobile Enhanced */}
      {selected && available && (
        <div className={cn(
          "absolute bg-orange-500 rounded-full border-2 border-white",
          // Mobile-optimized indicator size
          "-top-1 -right-1 w-4 h-4 sm:w-3 sm:h-3"
        )}>
          <CheckCircle2 className={cn(
            "text-white absolute",
            // Responsive positioning
            "h-3 w-3 -top-0.5 -left-0.5 sm:h-2 sm:w-2"
          )} />
        </div>
      )}
    </Button>
  );

  // Wrap with tooltip if location information is available
  if (locationName && !isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">{locationName}</p>
              <p className="text-xs text-gray-600">
                Horário: {time}
              </p>
              {isLocationFiltered && (
                <p className="text-xs text-amber-600">
                  Filtrado por localização
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};

export default TimeSlotButton;