import React, { useState, useMemo, useCallback } from 'react';
import { 
  Clock, 
  Building, 
  Filter, 
  X, 
  Grid3X3, 
  List, 
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TimeSlotButton } from '@/components/scheduling/TimeSlotButton';
import { LocationCard } from './LocationCard';
import { EnhancedTimeSlot, LocationWithTimeSlots } from '@/types/location';

interface LocationTimeSlotMappingProps {
  timeSlots: EnhancedTimeSlot[];
  locations: LocationWithTimeSlots[];
  selectedTimeSlot?: string;
  selectedLocationId?: string;
  onTimeSlotSelect: (timeSlot: string, locationId: string) => void;
  onLocationSelect?: (locationId: string) => void;
  groupByLocation?: boolean;
  showMatrix?: boolean;
  className?: string;
}

interface LocationPreferences {
  preferredLocationIds: string[];
  maxDistance?: number;
  requiredFacilities: string[];
  autoSelectPreferred: boolean;
}

interface TimeSlotGroup {
  locationId: string;
  locationName: string;
  timeSlots: EnhancedTimeSlot[];
  availableCount: number;
}

export const LocationTimeSlotMapping: React.FC<LocationTimeSlotMappingProps> = ({
  timeSlots,
  locations,
  selectedTimeSlot,
  selectedLocationId,
  onTimeSlotSelect,
  onLocationSelect,
  groupByLocation = true,
  showMatrix = false,
  className
}) => {
  const [viewMode, setViewMode] = useState<'grouped' | 'matrix' | 'list'>('grouped');
  const [filterLocationId, setFilterLocationId] = useState<string | null>(selectedLocationId || null);
  const [preferences, setPreferences] = useState<LocationPreferences>({
    preferredLocationIds: [],
    requiredFacilities: [],
    autoSelectPreferred: false
  });
  const [showPreferences, setShowPreferences] = useState(false);

  // Group time slots by location
  const timeSlotGroups = useMemo<TimeSlotGroup[]>(() => {
    const groups = new Map<string, TimeSlotGroup>();
    
    timeSlots.forEach(slot => {
      const location = locations.find(loc => loc.id === slot.location_id);
      if (!location) return;
      
      if (!groups.has(slot.location_id)) {
        groups.set(slot.location_id, {
          locationId: slot.location_id,
          locationName: slot.location_name,
          timeSlots: [],
          availableCount: 0
        });
      }
      
      const group = groups.get(slot.location_id)!;
      group.timeSlots.push(slot);
      if (slot.available) {
        group.availableCount++;
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => {
      // Sort by preference first, then by available slots
      const aPreferred = preferences.preferredLocationIds.includes(a.locationId);
      const bPreferred = preferences.preferredLocationIds.includes(b.locationId);
      
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      
      return b.availableCount - a.availableCount;
    });
  }, [timeSlots, locations, preferences.preferredLocationIds]);

  // Filter time slots based on selected location
  const filteredTimeSlots = useMemo(() => {
    if (!filterLocationId) return timeSlots;
    return timeSlots.filter(slot => slot.location_id === filterLocationId);
  }, [timeSlots, filterLocationId]);

  // Get unique time periods for matrix view
  const uniqueTimes = useMemo(() => {
    const times = new Set(timeSlots.map(slot => slot.time));
    return Array.from(times).sort();
  }, [timeSlots]);

  // Handle time slot selection
  const handleTimeSlotSelect = useCallback((time: string, locationId: string) => {
    onTimeSlotSelect(time, locationId);
    if (onLocationSelect) {
      onLocationSelect(locationId);
    }
  }, [onTimeSlotSelect, onLocationSelect]);

  // Handle location filter
  const handleLocationFilter = useCallback((locationId: string | null) => {
    setFilterLocationId(locationId);
    if (locationId && onLocationSelect) {
      onLocationSelect(locationId);
    }
  }, [onLocationSelect]);

  // Save location preferences (mock implementation)
  const savePreferences = useCallback((newPreferences: LocationPreferences) => {
    setPreferences(newPreferences);
    // In a real implementation, this would save to localStorage or backend
    localStorage.setItem('locationPreferences', JSON.stringify(newPreferences));
  }, []);

  // Load preferences on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('locationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load location preferences:', error);
      }
    }
  }, []);

  const renderGroupedView = () => (
    <div className="space-y-6">
      {timeSlotGroups.map((group) => {
        const location = locations.find(loc => loc.id === group.locationId);
        if (!location) return null;
        
        const isFiltered = filterLocationId && filterLocationId !== group.locationId;
        const isPreferred = preferences.preferredLocationIds.includes(group.locationId);
        
        return (
          <Card 
            key={group.locationId} 
            className={cn(
              "transition-all duration-200",
              isFiltered && "opacity-50",
              isPreferred && "ring-2 ring-blue-200 bg-blue-50/30"
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isPreferred ? "bg-blue-100" : "bg-orange-100"
                  )}>
                    <Building className={cn(
                      "h-5 w-5",
                      isPreferred ? "text-blue-600" : "text-orange-600"
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.locationName}
                      {isPreferred && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          Preferido
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {location.endereco_completo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={group.availableCount > 0 ? "default" : "secondary"}
                    className={cn(
                      group.availableCount > 0 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {group.availableCount} disponível{group.availableCount !== 1 ? 'eis' : ''}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLocationFilter(
                      filterLocationId === group.locationId ? null : group.locationId
                    )}
                    className={cn(
                      "h-8",
                      filterLocationId === group.locationId && "bg-blue-100 text-blue-700 border-blue-300"
                    )}
                  >
                    {filterLocationId === group.locationId ? (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                      </>
                    ) : (
                      <>
                        <Filter className="h-3 w-3 mr-1" />
                        Filtrar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {group.timeSlots.map((slot) => (
                  <TimeSlotButton
                    key={`${slot.time}-${slot.location_id}`}
                    time={slot.time}
                    available={slot.available}
                    selected={selectedTimeSlot === slot.time && selectedLocationId === slot.location_id}
                    onClick={() => handleTimeSlotSelect(slot.time, slot.location_id)}
                    locationId={slot.location_id}
                    locationName={slot.location_name}
                    showLocationBadge={false}
                    isLocationFiltered={!!filterLocationId && filterLocationId !== slot.location_id}
                    className="h-12"
                  />
                ))}
              </div>
              
              {group.timeSlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum horário disponível neste estabelecimento</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderMatrixView = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 border-b font-semibold text-gray-700">
                Estabelecimento
              </th>
              {uniqueTimes.map(time => (
                <th key={time} className="text-center p-2 border-b font-medium text-sm text-gray-600 min-w-[80px]">
                  {time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map(location => {
              const locationSlots = timeSlots.filter(slot => slot.location_id === location.id);
              const isPreferred = preferences.preferredLocationIds.includes(location.id);
              
              return (
                <tr 
                  key={location.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    isPreferred && "bg-blue-50/50"
                  )}
                >
                  <td className="p-3 border-b">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">{location.nome_local}</p>
                        <p className="text-xs text-gray-500">{location.bairro}, {location.cidade}</p>
                      </div>
                      {isPreferred && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          Preferido
                        </Badge>
                      )}
                    </div>
                  </td>
                  {uniqueTimes.map(time => {
                    const slot = locationSlots.find(s => s.time === time);
                    const isSelected = selectedTimeSlot === time && selectedLocationId === location.id;
                    
                    return (
                      <td key={`${location.id}-${time}`} className="p-1 border-b text-center">
                        {slot ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTimeSlotSelect(time, location.id)}
                            disabled={!slot.available}
                            className={cn(
                              "h-8 w-full text-xs",
                              slot.available && !isSelected && "hover:bg-orange-50 hover:border-orange-300",
                              isSelected && "bg-orange-100 border-orange-500 text-orange-800",
                              !slot.available && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            {slot.available ? (
                              isSelected ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        ) : (
                          <div className="h-8 flex items-center justify-center">
                            <span className="text-gray-300">-</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {filteredTimeSlots
        .filter(slot => slot.available)
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((slot) => {
          const location = locations.find(loc => loc.id === slot.location_id);
          if (!location) return null;
          
          const isSelected = selectedTimeSlot === slot.time && selectedLocationId === slot.location_id;
          const isPreferred = preferences.preferredLocationIds.includes(slot.location_id);
          
          return (
            <Card 
              key={`${slot.time}-${slot.location_id}`}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected && "ring-2 ring-orange-300 bg-orange-50",
                isPreferred && "border-blue-200 bg-blue-50/30"
              )}
              onClick={() => handleTimeSlotSelect(slot.time, slot.location_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isSelected ? "bg-orange-100" : "bg-gray-100"
                    )}>
                      <Clock className={cn(
                        "h-5 w-5",
                        isSelected ? "text-orange-600" : "text-gray-600"
                      )} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{slot.time}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>{slot.location_name}</span>
                        {isPreferred && (
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            Preferido
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{location.bairro}, {location.cidade}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Disponível
                    </Badge>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            Horários por Estabelecimento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
              className="h-8"
            >
              <Settings className="h-3 w-3 mr-1" />
              Preferências
            </Button>
          </div>
        </div>
        
        {/* Filter and View Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {filterLocationId && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Filtrado: {locations.find(l => l.id === filterLocationId)?.nome_local}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLocationFilter(null)}
                  className="h-5 w-5 p-0 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grouped' | 'matrix' | 'list')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grouped" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                Agrupado
              </TabsTrigger>
              <TabsTrigger value="matrix" className="flex items-center gap-1">
                <Grid3X3 className="h-3 w-3" />
                Matriz
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="h-3 w-3" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Preferences Panel */}
        {showPreferences && (
          <Card className="mt-4 bg-gray-50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Preferências de Localização</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-select"
                    checked={preferences.autoSelectPreferred}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, autoSelectPreferred: checked })
                    }
                  />
                  <Label htmlFor="auto-select" className="text-sm">
                    Selecionar automaticamente estabelecimentos preferidos
                  </Label>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Estabelecimentos Preferidos
                  </Label>
                  <div className="space-y-2">
                    {locations.map(location => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Switch
                          id={`pref-${location.id}`}
                          checked={preferences.preferredLocationIds.includes(location.id)}
                          onCheckedChange={(checked) => {
                            const newPreferred = checked
                              ? [...preferences.preferredLocationIds, location.id]
                              : preferences.preferredLocationIds.filter(id => id !== location.id);
                            savePreferences({ ...preferences, preferredLocationIds: newPreferred });
                          }}
                        />
                        <Label htmlFor={`pref-${location.id}`} className="text-sm">
                          {location.nome_local}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{locations.length}</p>
            <p className="text-sm text-blue-700">Estabelecimentos</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {timeSlots.filter(slot => slot.available).length}
            </p>
            <p className="text-sm text-green-700">Horários Disponíveis</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {preferences.preferredLocationIds.length}
            </p>
            <p className="text-sm text-orange-700">Preferidos</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {filterLocationId ? 1 : locations.length}
            </p>
            <p className="text-sm text-purple-700">Exibindo</p>
          </div>
        </div>

        {/* Content based on view mode */}
        <Tabs value={viewMode} className="w-full">
          <TabsContent value="grouped" className="mt-0">
            {renderGroupedView()}
          </TabsContent>
          <TabsContent value="matrix" className="mt-0">
            {renderMatrixView()}
          </TabsContent>
          <TabsContent value="list" className="mt-0">
            {renderListView()}
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {timeSlots.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Nenhum horário disponível
            </p>
            <p className="text-gray-500">
              Selecione uma data diferente ou tente outro médico
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTimeSlotMapping;