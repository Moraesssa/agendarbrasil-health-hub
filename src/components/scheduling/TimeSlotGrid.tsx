import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle2, ArrowLeft, ArrowRight, Calendar, Building, Filter, X, Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeArrayAccess, safeArrayLength, isEmptyOrUndefined } from "@/utils/arrayUtils";
import { TimeSlotButton } from "./TimeSlotButton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationDetailsPanel } from "@/components/location/LocationDetailsPanel";
import { LocationTimeSlotMapping } from "@/components/location/LocationTimeSlotMapping";
import { LocationWithTimeSlots, EnhancedTimeSlot } from "@/types/location";

interface TimeSlot {
  time: string;
  available: boolean;
  location_id?: string;
  location_name?: string;
}

interface LocationInfo {
  id: string;
  nome_local: string;
  endereco: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  horarios_disponiveis: Array<{ time: string; available: boolean }>;
}

interface TimeSlotGridProps {
  timeSlots: TimeSlot[] | undefined | null;
  selectedTime: string;
  isLoading: boolean;
  onChange: (time: string) => void;
  disabled?: boolean;
  locaisInfo?: LocationInfo[];
  selectedLocationId?: string;
  onLocationFilter?: (locationId: string | null) => void;
  showLocationBadges?: boolean;
  // Enhanced location integration props
  locationsWithDetails?: LocationWithTimeSlots[];
  onLocationSelect?: (locationId: string) => void;
  showLocationDetailsPanel?: boolean;
  enableLocationComparison?: boolean;
  viewMode?: 'grid' | 'grouped' | 'matrix';
  onViewModeChange?: (mode: 'grid' | 'grouped' | 'matrix') => void;
}

export function TimeSlotGrid({ 
  timeSlots, 
  selectedTime, 
  isLoading, 
  onChange, 
  disabled = false,
  locaisInfo = [],
  selectedLocationId,
  onLocationFilter,
  showLocationBadges = false,
  // Enhanced location integration props
  locationsWithDetails = [],
  onLocationSelect,
  showLocationDetailsPanel = false,
  enableLocationComparison = false,
  viewMode = 'grid',
  onViewModeChange
}: TimeSlotGridProps) {
  // Use defensive programming to safely access timeSlots array
  const safeTimeSlots = safeArrayAccess(timeSlots);
  const timeSlotsLength = safeArrayLength(timeSlots);
  const hasNoTimeSlots = isEmptyOrUndefined(timeSlots);
  const availableSlots = safeTimeSlots.filter(slot => slot && slot.available);
  
  // Enhanced time slots with location information
  const enhancedTimeSlots = safeTimeSlots.map(slot => {
    // Find location info for this time slot
    const locationInfo = locaisInfo.find(local => 
      local.horarios_disponiveis.some(h => h.time === slot.time && h.available === slot.available)
    );
    
    return {
      ...slot,
      location_id: locationInfo?.id,
      location_name: locationInfo?.nome_local
    };
  });

  // Filter time slots by selected location if applicable
  const filteredTimeSlots = selectedLocationId 
    ? enhancedTimeSlots.filter(slot => slot.location_id === selectedLocationId)
    : enhancedTimeSlots;
  
  const filteredAvailableSlots = filteredTimeSlots.filter(slot => slot && slot.available);

  // Convert time slots to enhanced format for LocationTimeSlotMapping
  const enhancedTimeSlotsForMapping: EnhancedTimeSlot[] = safeTimeSlots.map(slot => ({
    time: slot.time,
    available: slot.available,
    location_id: slot.location_id || '',
    location_name: slot.location_name || '',
    duration_minutes: 30, // Default duration
    tipo_consulta: 'presencial' as const,
    medico_id: '' // This would come from parent component
  }));

  // Handle location selection with persistence
  const handleLocationSelect = (locationId: string) => {
    if (onLocationSelect) {
      onLocationSelect(locationId);
    }
    if (onLocationFilter) {
      onLocationFilter(locationId);
    }
    
    // Persist location selection in localStorage
    try {
      localStorage.setItem('selectedLocationId', locationId);
    } catch (error) {
      console.warn('Failed to persist location selection:', error);
    }
  };

  // Handle time slot selection with location association
  const handleTimeSlotSelect = (time: string, locationId?: string) => {
    onChange(time);
    if (locationId && onLocationSelect) {
      onLocationSelect(locationId);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'grouped' | 'matrix') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
    
    // Persist view mode preference
    try {
      localStorage.setItem('timeSlotViewMode', mode);
    } catch (error) {
      console.warn('Failed to persist view mode:', error);
    }
  };
  
  console.log("🔍 TimeSlotGrid - Debug:", {
    timeSlots,
    safeTimeSlots: safeTimeSlots.length,
    enhancedTimeSlots: enhancedTimeSlots.length,
    filteredTimeSlots: filteredTimeSlots.length,
    hasNoTimeSlots,
    availableSlots: availableSlots.length,
    filteredAvailableSlots: filteredAvailableSlots.length,
    selectedLocationId,
    isLoading
  });

  return (
    <div className="space-y-6">
      {/* Location Details Panel */}
      {showLocationDetailsPanel && locationsWithDetails.length > 0 && (
        <LocationDetailsPanel
          locations={locationsWithDetails}
          selectedLocation={selectedLocationId}
          onLocationSelect={handleLocationSelect}
          onLocationFilter={onLocationFilter || (() => {})}
          showComparison={enableLocationComparison}
          isLoading={isLoading}
          className="max-w-6xl mx-auto"
        />
      )}

      <Card className={cn(
        "w-full mx-auto shadow-lg bg-gradient-to-br from-white to-orange-50/30",
        // Mobile-first responsive sizing
        "max-w-full sm:max-w-2xl lg:max-w-4xl",
        // Mobile-optimized border and shadow
        "border-0 sm:border shadow-sm sm:shadow-lg"
      )}>
        <CardHeader className={cn(
          // Responsive padding
          "pb-3 px-4 pt-4 sm:pb-4 sm:px-6 sm:pt-6"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={cn(
                "flex items-center gap-3 font-semibold text-gray-800",
                // Responsive title sizing
                "text-lg sm:text-xl"
              )}>
                <div className={cn(
                  "bg-orange-100 rounded-lg",
                  // Responsive icon container
                  "p-1.5 sm:p-2"
                )}>
                  <Clock className={cn(
                    "text-orange-600",
                    // Responsive icon sizing
                    "h-4 w-4 sm:h-5 sm:w-5"
                  )} />
                </div>
                <span className="truncate">
                  {window.innerWidth < 640 ? "Horários" : "Selecione o Horário"}
                </span>
              </CardTitle>
              <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mt-2"></div>
            </div>
            
            {/* View Mode Toggle */}
            {locationsWithDetails.length > 0 && onViewModeChange && (
              <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="grid" className="flex items-center gap-1">
                    <Grid3X3 className="h-3 w-3" />
                    Grade
                  </TabsTrigger>
                  <TabsTrigger value="grouped" className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    Agrupado
                  </TabsTrigger>
                  <TabsTrigger value="matrix" className="flex items-center gap-1">
                    <List className="h-3 w-3" />
                    Matriz
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={cn(
          // Responsive content spacing
          "space-y-4 px-4 pb-4 sm:space-y-6 sm:px-6 sm:pb-6"
        )}>
          {/* Enhanced view modes */}
          {locationsWithDetails.length > 0 && viewMode === 'grouped' ? (
            <LocationTimeSlotMapping
              timeSlots={enhancedTimeSlotsForMapping}
              locations={locationsWithDetails}
              selectedTimeSlot={selectedTime}
              selectedLocationId={selectedLocationId}
              onTimeSlotSelect={handleTimeSlotSelect}
              onLocationSelect={handleLocationSelect}
              groupByLocation={true}
              showMatrix={false}
            />
          ) : locationsWithDetails.length > 0 && viewMode === 'matrix' ? (
            <LocationTimeSlotMapping
              timeSlots={enhancedTimeSlotsForMapping}
              locations={locationsWithDetails}
              selectedTimeSlot={selectedTime}
              selectedLocationId={selectedLocationId}
              onTimeSlotSelect={handleTimeSlotSelect}
              onLocationSelect={handleLocationSelect}
              groupByLocation={false}
              showMatrix={true}
            />
          ) : (
            <>
              {/* Legacy Estabelecimentos Disponíveis - shown only in grid mode */}
              {locaisInfo.length > 0 && viewMode === 'grid' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building className="h-4 w-4 text-orange-600" />
                      Estabelecimentos Disponíveis
                    </h3>
                    {selectedLocationId && onLocationFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLocationFilter(null)}
                        className="text-xs h-7"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar Filtro
                      </Button>
                    )}
                  </div>
                  
                  {selectedLocationId && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Mostrando apenas horários de: {locaisInfo.find(l => l.id === selectedLocationId)?.nome_local}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    {locaisInfo.map((local) => {
                      const isSelected = selectedLocationId === local.id;
                      const availableCount = local.horarios_disponiveis?.filter(h => h.available).length || 0;
                      
                      return (
                        <div 
                          key={local.id} 
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200",
                            isSelected 
                              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" 
                              : "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300"
                          )}
                          onClick={() => onLocationFilter?.(isSelected ? null : local.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              isSelected ? "bg-blue-100" : "bg-orange-100"
                            )}>
                              <Building className={cn(
                                "h-4 w-4",
                                isSelected ? "text-blue-600" : "text-orange-600"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{local.nome_local}</p>
                              <p className="text-xs text-gray-600">
                                {local.endereco?.logradouro}, {local.endereco?.numero} - {local.endereco?.bairro}
                              </p>
                              <p className="text-xs text-gray-500">
                                {local.endereco?.cidade}, {local.endereco?.uf}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "text-xs",
                                  isSelected 
                                    ? "bg-blue-100 text-blue-800 border-blue-200" 
                                    : "bg-orange-100 text-orange-700 border-orange-200"
                                )}
                              >
                                {availableCount} horários
                              </Badge>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Time Slots Grid - shown in grid mode */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <div className="p-3 bg-blue-100 rounded-full mb-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                    <p className="font-medium text-gray-700">Carregando horários disponíveis</p>
                    <p className="text-sm text-gray-500">Verificando agenda...</p>
                  </div>
                ) : hasNoTimeSlots || filteredAvailableSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <div className="p-3 bg-amber-100 rounded-full mb-4">
                      <Calendar className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="font-medium text-amber-700">
                      {selectedLocationId ? 'Nenhum horário disponível neste estabelecimento' : 'Nenhum horário disponível'}
                    </p>
                    <p className="text-sm text-amber-600">
                      {selectedLocationId 
                        ? 'Tente selecionar outro estabelecimento ou data' 
                        : 'Selecione outra data para ver os horários'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      // Mobile-first responsive grid
                      "grid gap-3",
                      // Responsive columns - optimized for touch targets
                      "grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
                      // Adjust gap for mobile
                      "gap-2 sm:gap-3"
                    )}>
                      {filteredTimeSlots.map((slot, index) => (
                        <TimeSlotButton
                          key={`${slot.time}-${slot.location_id || 'no-location'}`}
                          time={slot.time}
                          available={slot.available}
                          selected={selectedTime === slot.time}
                          disabled={disabled}
                          onClick={() => handleTimeSlotSelect(slot.time, slot.location_id)}
                          locationId={slot.location_id}
                          locationName={slot.location_name}
                          showLocationBadges={showLocationBadges && (locaisInfo.length > 1 || locationsWithDetails.length > 1)}
                          isLocationFiltered={!!selectedLocationId}
                          className={cn(
                            // Staggered animation
                            "animate-in fade-in slide-in-from-bottom-2",
                            `animation-delay-${Math.min(index * 50, 500)}ms`
                          )}
                        />
                      ))}
                    </div>

                    {/* Status Information */}
                    <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <p className="text-sm text-orange-700 font-medium">
                        {filteredAvailableSlots.length} horário{filteredAvailableSlots.length !== 1 ? 's' : ''} disponível{filteredAvailableSlots.length !== 1 ? 'eis' : ''}
                        {selectedLocationId && (
                          <span className="ml-1 text-blue-700">
                            no estabelecimento selecionado
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
