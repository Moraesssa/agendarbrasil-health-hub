import React, { useState } from 'react';
import { TimeSlotGrid } from './TimeSlotGrid';
import { LocationWithTimeSlots } from '@/types/location';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Mock data for demonstration
const mockTimeSlots = [
  { time: '08:00', available: true, location_id: 'loc-1', location_name: 'Hospital Central' },
  { time: '08:30', available: true, location_id: 'loc-1', location_name: 'Hospital Central' },
  { time: '09:00', available: true, location_id: 'loc-2', location_name: 'Clínica Norte' },
  { time: '09:30', available: false, location_id: 'loc-1', location_name: 'Hospital Central' },
  { time: '10:00', available: true, location_id: 'loc-2', location_name: 'Clínica Norte' },
  { time: '10:30', available: true, location_id: 'loc-3', location_name: 'Centro Médico Sul' },
  { time: '11:00', available: true, location_id: 'loc-1', location_name: 'Hospital Central' },
  { time: '11:30', available: false, location_id: 'loc-2', location_name: 'Clínica Norte' },
  { time: '14:00', available: true, location_id: 'loc-3', location_name: 'Centro Médico Sul' },
  { time: '14:30', available: true, location_id: 'loc-1', location_name: 'Hospital Central' },
  { time: '15:00', available: true, location_id: 'loc-2', location_name: 'Clínica Norte' },
  { time: '15:30', available: true, location_id: 'loc-3', location_name: 'Centro Médico Sul' },
];

const mockLocationsWithDetails: LocationWithTimeSlots[] = [
  {
    id: 'loc-1',
    nome_local: 'Hospital Central',
    endereco_completo: 'Rua Principal, 123 - Centro',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-000',
    telefone: '(11) 1234-5678',
    email: 'contato@hospitalcentral.com.br',
    website: 'https://hospitalcentral.com.br',
    coordenadas: { lat: -23.5505, lng: -46.6333, precisao: 'exata' },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito', details: '200 vagas' },
      { type: 'acessibilidade', available: true, details: 'Rampas e elevadores' },
      { type: 'farmacia', available: true, details: '24 horas' },
      { type: 'wifi', available: true, cost: 'gratuito' }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2025-01-31T10:00:00Z',
    verificado_em: '2025-01-31T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 6,
    is_open_now: true,
    distance_km: 2.5
  },
  {
    id: 'loc-2',
    nome_local: 'Clínica Norte',
    endereco_completo: 'Av. Norte, 456 - Vila Norte',
    bairro: 'Vila Norte',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '02000-000',
    telefone: '(11) 9876-5432',
    email: 'atendimento@clinicanorte.com.br',
    coordenadas: { lat: -23.5205, lng: -46.6133, precisao: 'exata' },
    horario_funcionamento: {
      segunda: { abertura: '07:00', fechamento: '19:00', fechado: false },
      terca: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quarta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quinta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sexta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '14:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'pago', details: 'R$ 5,00/hora' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'ar_condicionado', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2025-01-31T10:00:00Z',
    verificado_em: '2025-01-31T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 4,
    is_open_now: true,
    distance_km: 5.2
  },
  {
    id: 'loc-3',
    nome_local: 'Centro Médico Sul',
    endereco_completo: 'Rua Sul, 789 - Jardim Sul',
    bairro: 'Jardim Sul',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04000-000',
    telefone: '(11) 5555-1234',
    email: 'contato@centromedicosul.com.br',
    coordenadas: { lat: -23.5805, lng: -46.6533, precisao: 'exata' },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '17:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '17:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito', details: '50 vagas' },
      { type: 'acessibilidade', available: true },
      { type: 'laboratorio', available: true, details: 'Exames básicos' }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2025-01-31T10:00:00Z',
    verificado_em: '2025-01-31T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 3,
    is_open_now: true,
    distance_km: 8.1
  }
];

const mockLegacyLocaisInfo = [
  {
    id: 'loc-1',
    nome_local: 'Hospital Central',
    endereco: {
      logradouro: 'Rua Principal',
      numero: '123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      uf: 'SP'
    },
    horarios_disponiveis: mockTimeSlots.filter(slot => slot.location_id === 'loc-1')
  },
  {
    id: 'loc-2',
    nome_local: 'Clínica Norte',
    endereco: {
      logradouro: 'Av. Norte',
      numero: '456',
      bairro: 'Vila Norte',
      cidade: 'São Paulo',
      uf: 'SP'
    },
    horarios_disponiveis: mockTimeSlots.filter(slot => slot.location_id === 'loc-2')
  },
  {
    id: 'loc-3',
    nome_local: 'Centro Médico Sul',
    endereco: {
      logradouro: 'Rua Sul',
      numero: '789',
      bairro: 'Jardim Sul',
      cidade: 'São Paulo',
      uf: 'SP'
    },
    horarios_disponiveis: mockTimeSlots.filter(slot => slot.location_id === 'loc-3')
  }
];

export const TimeSlotGridDemo: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'grouped' | 'matrix'>('grid');
  const [showLocationDetailsPanel, setShowLocationDetailsPanel] = useState(false);
  const [enableLocationComparison, setEnableLocationComparison] = useState(false);
  const [showLocationBadges, setShowLocationBadges] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    console.log('Selected time:', time);
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    console.log('Selected location:', locationId);
  };

  const handleLocationFilter = (locationId: string | null) => {
    setSelectedLocationId(locationId || undefined);
    console.log('Filtered by location:', locationId);
  };

  const handleViewModeChange = (mode: 'grid' | 'grouped' | 'matrix') => {
    setViewMode(mode);
    console.log('View mode changed to:', mode);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const resetDemo = () => {
    setSelectedTime('');
    setSelectedLocationId(undefined);
    setViewMode('grid');
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>TimeSlotGrid Enhanced Demo</CardTitle>
          <p className="text-sm text-gray-600">
            Demonstração das funcionalidades aprimoradas do TimeSlotGrid com integração de localização
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Configurações de Exibição</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="location-details"
                    checked={showLocationDetailsPanel}
                    onCheckedChange={setShowLocationDetailsPanel}
                  />
                  <Label htmlFor="location-details" className="text-sm">
                    Mostrar Painel de Detalhes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="location-comparison"
                    checked={enableLocationComparison}
                    onCheckedChange={setEnableLocationComparison}
                  />
                  <Label htmlFor="location-comparison" className="text-sm">
                    Habilitar Comparação
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="location-badges"
                    checked={showLocationBadges}
                    onCheckedChange={setShowLocationBadges}
                  />
                  <Label htmlFor="location-badges" className="text-sm">
                    Mostrar Badges de Localização
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado Atual</Label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Horário:</span>
                  <Badge variant={selectedTime ? "default" : "secondary"}>
                    {selectedTime || 'Nenhum'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Local:</span>
                  <Badge variant={selectedLocationId ? "default" : "secondary"}>
                    {selectedLocationId 
                      ? mockLocationsWithDetails.find(l => l.id === selectedLocationId)?.nome_local || 'Desconhecido'
                      : 'Nenhum'
                    }
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Modo:</span>
                  <Badge variant="outline">{viewMode}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Ações</Label>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={simulateLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Carregando...' : 'Simular Carregamento'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetDemo}
                >
                  Resetar Demo
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{mockTimeSlots.length}</p>
              <p className="text-sm text-blue-700">Total de Horários</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {mockTimeSlots.filter(slot => slot.available).length}
              </p>
              <p className="text-sm text-green-700">Disponíveis</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{mockLocationsWithDetails.length}</p>
              <p className="text-sm text-orange-700">Estabelecimentos</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {selectedLocationId ? 1 : mockLocationsWithDetails.length}
              </p>
              <p className="text-sm text-purple-700">Exibindo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced TimeSlotGrid */}
      <TimeSlotGrid
        timeSlots={mockTimeSlots}
        selectedTime={selectedTime}
        isLoading={isLoading}
        onChange={handleTimeChange}
        disabled={false}
        locaisInfo={mockLegacyLocaisInfo}
        selectedLocationId={selectedLocationId}
        onLocationFilter={handleLocationFilter}
        showLocationBadges={showLocationBadges}
        // Enhanced props
        locationsWithDetails={mockLocationsWithDetails}
        onLocationSelect={handleLocationSelect}
        showLocationDetailsPanel={showLocationDetailsPanel}
        enableLocationComparison={enableLocationComparison}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto">
            {JSON.stringify({
              selectedTime,
              selectedLocationId,
              viewMode,
              showLocationDetailsPanel,
              enableLocationComparison,
              showLocationBadges,
              isLoading,
              availableSlots: mockTimeSlots.filter(slot => slot.available).length,
              filteredSlots: selectedLocationId 
                ? mockTimeSlots.filter(slot => slot.location_id === selectedLocationId && slot.available).length
                : mockTimeSlots.filter(slot => slot.available).length
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSlotGridDemo;