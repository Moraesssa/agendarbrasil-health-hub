import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Calendar, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LocalComHorarios } from '@/services/newAppointmentService';
import { TimeSlot } from '@/utils/timeSlotUtils';
import { useAdvancedScheduling } from '@/hooks/useAdvancedScheduling';
import { safeArrayAccess, safeArrayLength, safeArrayMap } from '@/utils/arrayUtils';

interface EnhancedTimeSlotGridProps {
  selectedTime: string;
  timeSlots: TimeSlot[];
  locaisInfo: LocalComHorarios[];
  isLoading: boolean;
  selectedDate: string;
  selectedDoctor: string;
  onChange: (time: string, local: LocalComHorarios) => void;
}

interface TimeSlotWithLocation extends TimeSlot {
  locations: {
    local: LocalComHorarios;
    distance?: string;
    popular?: boolean;
  }[];
}

const TIME_PERIODS = {
  morning: { label: 'Manhã', range: [6, 12], icon: '🌅' },
  afternoon: { label: 'Tarde', range: [12, 18], icon: '☀️' },
  evening: { label: 'Noite', range: [18, 24], icon: '🌙' }
};

export const EnhancedTimeSlotGrid: React.FC<EnhancedTimeSlotGridProps> = ({
  selectedTime,
  timeSlots,
  locaisInfo,
  isLoading,
  selectedDate,
  selectedDoctor,
  onChange
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showUnavailable, setShowUnavailable] = useState(false);
  
  const { 
    temporaryReservation, 
    createTemporaryReservation,
    getReservationTimeRemaining 
  } = useAdvancedScheduling();

  // Enhanced time slots with location info
  const enhancedTimeSlots = useMemo((): TimeSlotWithLocation[] => {
    const slotsMap = new Map<string, TimeSlotWithLocation>();
    const safeTimeSlots = safeArrayAccess(timeSlots);
    const safeLocaisInfo = safeArrayAccess(locaisInfo);

    // Group slots by time
    safeTimeSlots.forEach(slot => {
      if (!slotsMap.has(slot.time)) {
        slotsMap.set(slot.time, {
          ...slot,
          locations: []
        });
      }
    });

    // Add location information
    safeLocaisInfo.forEach(local => {
      const horariosDisponiveis = safeArrayAccess(local.horarios_disponiveis);
      horariosDisponiveis.forEach(slot => {
        const enhancedSlot = slotsMap.get(slot.time);
        if (enhancedSlot && slot.available) {
          enhancedSlot.locations.push({
            local,
            distance: getRandomDistance(),
            popular: Math.random() > 0.7
          });
        }
      });
    });

    return Array.from(slotsMap.values()).sort((a, b) => a.time.localeCompare(b.time));
  }, [timeSlots, locaisInfo]);

  // Filter slots by period and location
  const filteredSlots = useMemo(() => {
    let filtered = safeArrayAccess(enhancedTimeSlots);

    // Filter by time period
    if (selectedPeriod !== 'all') {
      const period = TIME_PERIODS[selectedPeriod as keyof typeof TIME_PERIODS];
      filtered = filtered.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= period.range[0] && hour < period.range[1];
      });
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(slot =>
        slot.locations.some(loc => loc.local.id === selectedLocation)
      );
    }

    // Filter availability
    if (!showUnavailable) {
      filtered = filtered.filter(slot => slot.available && slot.locations.length > 0);
    }

    return filtered;
  }, [enhancedTimeSlots, selectedPeriod, selectedLocation, showUnavailable]);

  // Group slots by time period
  const slotsByPeriod = useMemo(() => {
    const groups: Record<string, TimeSlotWithLocation[]> = {
      morning: [],
      afternoon: [],
      evening: []
    };

    const safeFiltered = safeArrayAccess(filteredSlots);
    safeFiltered.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour >= 6 && hour < 12) groups.morning.push(slot);
      else if (hour >= 12 && hour < 18) groups.afternoon.push(slot);
      else if (hour >= 18 && hour < 24) groups.evening.push(slot);
    });

    return groups;
  }, [filteredSlots]);

  const handleSlotSelect = async (slot: TimeSlotWithLocation) => {
    if (!slot.available || slot.locations.length === 0) return;

    // If multiple locations, use the first one (could be enhanced with selection dialog)
    const selectedLocationData = slot.locations[0].local;
    
    // Create temporary reservation
    const dateTime = new Date(`${selectedDate}T${slot.time}:00`).toISOString();
    const reserved = await createTemporaryReservation(
      selectedDoctor,
      dateTime,
      selectedLocationData.id
    );

    if (reserved) {
      onChange(slot.time, selectedLocationData);
    }
  };

  const getRandomDistance = (): string => {
    const distances = ['0.5 km', '1.2 km', '2.1 km', '3.4 km', '5.0 km'];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  const formatTimeRange = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const nextHour = hour === 23 ? 0 : hour + 1;
    return `${time} - ${nextHour.toString().padStart(2, '0')}:${minutes}`;
  };

  const getSlotStatusBadge = (slot: TimeSlotWithLocation) => {
    if (!slot.available) {
      return <Badge variant="destructive" className="text-xs">Ocupado</Badge>;
    }
    if (slot.locations.length === 0) {
      return <Badge variant="secondary" className="text-xs">Indisponível</Badge>;
    }
    if (slot.locations.some(l => l.popular)) {
      return <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">Popular</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Disponível</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Selecione o Horário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Selecione o Horário
          <Calendar className="w-4 h-4 ml-2 text-muted-foreground" />
          <span className="text-sm font-normal text-muted-foreground">
            {new Date(selectedDate).toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </span>
        </CardTitle>
        
        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedPeriod === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('all')}
            >
              Todos os horários
            </Button>
            {Object.entries(TIME_PERIODS).map(([key, period]) => (
              <Button
                key={key}
                variant={selectedPeriod === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(key)}
                className="flex items-center gap-1"
              >
                <span>{period.icon}</span>
                {period.label}
              </Button>
            ))}
          </div>

          {safeArrayLength(locaisInfo) > 1 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedLocation === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLocation('all')}
              >
                Todos os locais
              </Button>
              {safeArrayAccess(locaisInfo).map(local => (
                <Button
                  key={local.id}
                  variant={selectedLocation === local.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLocation(local.id)}
                  className="flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  {local.nome_local}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{safeArrayLength(filteredSlots)} horários encontrados</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showUnavailable}
                onChange={(e) => setShowUnavailable(e.target.checked)}
                className="rounded"
              />
              Mostrar indisponíveis
            </label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Temporary reservation alert */}
        {temporaryReservation && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Horário reservado temporariamente</span>
            </div>
            <p className="text-sm text-yellow-700">
              Você tem {Math.ceil(getReservationTimeRemaining() / (1000 * 60))} minutos para confirmar o agendamento.
            </p>
          </div>
        )}

        {safeArrayLength(filteredSlots) === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum horário disponível</h3>
            <p>
              {selectedPeriod !== 'all' || selectedLocation !== 'all'
                ? 'Tente ajustar os filtros para ver mais opções.'
                : 'Este médico não possui horários disponíveis para a data selecionada.'}
            </p>
            {(selectedPeriod !== 'all' || selectedLocation !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedPeriod('all');
                  setSelectedLocation('all');
                }}
                className="mt-2"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(TIME_PERIODS).map(([periodKey, periodInfo]) => {
              const periodSlots = slotsByPeriod[periodKey];
              if (periodSlots.length === 0) return null;

              return (
                <div key={periodKey}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span>{periodInfo.icon}</span>
                    {periodInfo.label}
                    <Badge variant="secondary" className="text-xs">
                      {periodSlots.length} horários
                    </Badge>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {periodSlots.map(slot => (
                      <Card
                        key={slot.time}
                        className={`cursor-pointer transition-all duration-200 ${
                          !slot.available || slot.locations.length === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : selectedTime === slot.time
                            ? 'ring-2 ring-primary bg-primary/10 scale-105 shadow-md'
                            : 'hover:shadow-md hover:scale-105'
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <CardContent className="p-3">
                          <div className="text-center mb-2">
                            <div className="font-bold text-lg">{slot.time}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimeRange(slot.time)}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {getSlotStatusBadge(slot)}
                            
                            {slot.locations.length > 0 && (
                              <div className="space-y-1">
                                {slot.locations.slice(0, 2).map((locInfo, index) => (
                                  <div key={index} className="text-xs">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{locInfo.local.nome_local}</span>
                                    </div>
                                    {locInfo.distance && (
                                      <div className="text-muted-foreground ml-4">
                                        📍 {locInfo.distance}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                
                                {slot.locations.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{slot.locations.length - 2} outros locais
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {selectedTime === slot.time && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-center gap-1 text-xs text-primary">
                                <CheckCircle2 className="w-3 h-3" />
                                Selecionado
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Legend */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Legenda:</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Popular</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-400"></div>
              <span>Indisponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Ocupado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};