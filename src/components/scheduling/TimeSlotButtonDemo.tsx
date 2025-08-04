import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimeSlotButton } from './TimeSlotButton';
import { Clock, Building } from 'lucide-react';

// Mock data for demonstration
const mockTimeSlots = [
  { time: '08:00', available: true, locationId: 'loc-1', locationName: 'Hospital São Lucas' },
  { time: '08:30', available: true, locationId: 'loc-2', locationName: 'Clínica Central' },
  { time: '09:00', available: false, locationId: 'loc-1', locationName: 'Hospital São Lucas' },
  { time: '09:30', available: true, locationId: 'loc-3', locationName: 'Centro Médico Norte' },
  { time: '10:00', available: true, locationId: 'loc-1', locationName: 'Hospital São Lucas' },
  { time: '10:30', available: true, locationId: 'loc-2', locationName: 'Clínica Central' },
  { time: '11:00', available: true, locationId: 'loc-3', locationName: 'Centro Médico Norte' },
  { time: '11:30', available: false, locationId: 'loc-2', locationName: 'Clínica Central' },
  { time: '14:00', available: true, locationId: 'loc-1', locationName: 'Hospital São Lucas' },
  { time: '14:30', available: true, locationId: 'loc-2', locationName: 'Clínica Central' },
  { time: '15:00', available: true, locationId: 'loc-3', locationName: 'Centro Médico Norte' },
  { time: '15:30', available: true, locationId: 'loc-1', locationName: 'Hospital São Lucas' },
];

const mockLocations = [
  { id: 'loc-1', name: 'Hospital São Lucas', color: 'blue' },
  { id: 'loc-2', name: 'Clínica Central', color: 'green' },
  { id: 'loc-3', name: 'Centro Médico Norte', color: 'purple' },
];

export const TimeSlotButtonDemo: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showLocationBadges, setShowLocationBadges] = useState(true);
  const [filteredLocationId, setFilteredLocationId] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const filteredTimeSlots = filteredLocationId 
    ? mockTimeSlots.filter(slot => slot.locationId === filteredLocationId)
    : mockTimeSlots;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            TimeSlotButton - Demonstração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-badges"
                checked={showLocationBadges}
                onCheckedChange={setShowLocationBadges}
              />
              <Label htmlFor="show-badges" className="text-sm">
                Mostrar badges de localização
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="disabled"
                checked={disabled}
                onCheckedChange={setDisabled}
              />
              <Label htmlFor="disabled" className="text-sm">
                Desabilitar botões
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Filtrar por localização:</Label>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={filteredLocationId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilteredLocationId(null)}
                  className="text-xs"
                >
                  Todos
                </Button>
                {mockLocations.map((location) => (
                  <Button
                    key={location.id}
                    variant={filteredLocationId === location.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilteredLocationId(location.id)}
                    className="text-xs"
                  >
                    <Building className="h-3 w-3 mr-1" />
                    {location.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Horário selecionado:</Label>
              <div className="text-sm font-mono bg-white p-2 rounded border">
                {selectedTime || 'Nenhum'}
              </div>
            </div>
          </div>

          {/* Location Legend */}
          {showLocationBadges && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Legenda de Estabelecimentos:</Label>
              <div className="flex flex-wrap gap-3">
                {mockLocations.map((location) => (
                  <div key={location.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full bg-${location.color}-200 border border-${location.color}-300`}></div>
                    <span>{location.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Slots Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Horários Disponíveis</h3>
              {filteredLocationId && (
                <div className="text-sm text-gray-600">
                  Mostrando apenas: {mockLocations.find(l => l.id === filteredLocationId)?.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredTimeSlots.map((slot, index) => (
                <TimeSlotButton
                  key={`${slot.time}-${slot.locationId}-${index}`}
                  time={slot.time}
                  available={slot.available}
                  selected={selectedTime === slot.time}
                  disabled={disabled}
                  onClick={() => setSelectedTime(slot.time)}
                  locationId={slot.locationId}
                  locationName={slot.locationName}
                  showLocationBadge={showLocationBadges}
                  isLocationFiltered={!!filteredLocationId}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total de horários:</span> {filteredTimeSlots.length}
                </div>
                <div>
                  <span className="font-medium">Disponíveis:</span> {filteredTimeSlots.filter(s => s.available).length}
                </div>
                <div>
                  <span className="font-medium">Estabelecimentos:</span> {new Set(filteredTimeSlots.map(s => s.locationId)).size}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recursos Implementados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">✅ Badge de Localização</h4>
                <p className="text-sm text-gray-600">
                  Cada horário mostra um badge com ícone do estabelecimento quando múltiplas localizações estão disponíveis.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">✅ Codificação por Cores</h4>
                <p className="text-sm text-gray-600">
                  Diferentes estabelecimentos recebem cores distintas para fácil identificação visual.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">✅ Tooltips Informativos</h4>
                <p className="text-sm text-gray-600">
                  Passe o mouse sobre os horários para ver o nome completo do estabelecimento.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">✅ Estados Desabilitados</h4>
                <p className="text-sm text-gray-600">
                  Horários são desabilitados quando filtros de localização estão ativos ou quando indisponíveis.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">✅ Estilo Específico por Local</h4>
                <p className="text-sm text-gray-600">
                  Cada estabelecimento tem seu próprio esquema de cores para hover e seleção.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">✅ Filtros de Localização</h4>
                <p className="text-sm text-gray-600">
                  Possibilidade de filtrar horários por estabelecimento específico.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSlotButtonDemo;