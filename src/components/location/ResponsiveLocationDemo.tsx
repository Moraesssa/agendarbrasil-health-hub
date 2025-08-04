import React, { useState } from 'react';
import { LocationDetailsPanel } from './LocationDetailsPanel';
import { TimeSlotGrid } from '@/components/scheduling/TimeSlotGrid';
import { LocationWithTimeSlots, EnhancedTimeSlot } from '@/types/location';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';

// Mock data for demonstration
const mockLocations: LocationWithTimeSlots[] = [
  {
    id: 'loc-1',
    nome_local: 'Clínica São Paulo',
    endereco_completo: 'Rua Augusta, 123 - Consolação, São Paulo - SP, 01305-000',
    bairro: 'Consolação',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01305-000',
    telefone: '(11) 3456-7890',
    email: 'contato@clinicasp.com.br',
    coordenadas: { lat: -23.5505, lng: -46.6333 },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '00:00', fechamento: '00:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, details: 'Gratuito', cost: 'gratuito' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '14:00', available: true }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 3,
    is_open_now: true
  },
  {
    id: 'loc-2',
    nome_local: 'Hospital das Clínicas',
    endereco_completo: 'Av. Dr. Enéas de Carvalho Aguiar, 255 - Cerqueira César, São Paulo - SP, 05403-000',
    bairro: 'Cerqueira César',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05403-000',
    telefone: '(11) 2661-0000',
    email: 'contato@hc.fm.usp.br',
    coordenadas: { lat: -23.5558, lng: -46.6696 },
    horario_funcionamento: {
      segunda: { abertura: '07:00', fechamento: '19:00', fechado: false },
      terca: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quarta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quinta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sexta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '14:00', fechado: false },
      domingo: { abertura: '00:00', fechamento: '00:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, details: 'Pago', cost: 'pago' },
      { type: 'acessibilidade', available: true },
      { type: 'farmacia', available: true },
      { type: 'laboratorio', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '08:00', available: true },
      { time: '11:00', available: true },
      { time: '15:00', available: true },
      { time: '16:00', available: true }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'api',
    available_slots_count: 4,
    is_open_now: true
  }
];

const mockTimeSlots: EnhancedTimeSlot[] = [
  { time: '08:00', available: true, location_id: 'loc-2', location_name: 'Hospital das Clínicas', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '09:00', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '10:00', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '11:00', available: true, location_id: 'loc-2', location_name: 'Hospital das Clínicas', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '14:00', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '15:00', available: true, location_id: 'loc-2', location_name: 'Hospital das Clínicas', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '16:00', available: true, location_id: 'loc-2', location_name: 'Hospital das Clínicas', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' }
];

export const ResponsiveLocationDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped' | 'matrix'>('grid');
  
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    screenWidth, 
    screenHeight,
    responsiveClasses 
  } = useResponsiveLayout();

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const handleLocationFilter = (locationId: string | null) => {
    setSelectedLocation(locationId || '');
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleViewModeChange = (mode: 'grid' | 'grouped' | 'matrix') => {
    setViewMode(mode);
  };

  const resetDemo = () => {
    setSelectedLocation('');
    setSelectedTime('');
    setViewMode('grid');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Demo Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Demonstração de Design Responsivo - Localização</span>
              <Button onClick={resetDemo} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Screen Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Informações da Tela</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {isMobile ? (
                      <Smartphone className="h-4 w-4 text-blue-600" />
                    ) : isTablet ? (
                      <Tablet className="h-4 w-4 text-green-600" />
                    ) : (
                      <Monitor className="h-4 w-4 text-purple-600" />
                    )}
                    <span>
                      {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                    </span>
                  </div>
                  <div>Largura: {screenWidth}px</div>
                  <div>Altura: {screenHeight}px</div>
                </div>
              </div>

              {/* Breakpoints */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Breakpoints Ativos</h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={isMobile ? "default" : "outline"} className="text-xs">
                    Mobile (&lt;768px)
                  </Badge>
                  <Badge variant={isTablet ? "default" : "outline"} className="text-xs">
                    Tablet (768-1024px)
                  </Badge>
                  <Badge variant={isDesktop ? "default" : "outline"} className="text-xs">
                    Desktop (&gt;1024px)
                  </Badge>
                </div>
              </div>

              {/* Selected State */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Estado Selecionado</h4>
                <div className="space-y-1 text-xs">
                  <div>Local: {selectedLocation || 'Nenhum'}</div>
                  <div>Horário: {selectedTime || 'Nenhum'}</div>
                  <div>Modo: {viewMode}</div>
                </div>
              </div>

              {/* Responsive Classes */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Classes Responsivas</h4>
                <div className="space-y-1 text-xs font-mono bg-gray-100 p-2 rounded">
                  <div>Container: {responsiveClasses.container}</div>
                  <div>Grid: {responsiveClasses.grid}</div>
                  <div>Button: {responsiveClasses.button}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Details Panel */}
        <LocationDetailsPanel
          locations={mockLocations}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          onLocationFilter={handleLocationFilter}
          showComparison={true}
          isLoading={false}
        />

        {/* Time Slot Grid */}
        <TimeSlotGrid
          timeSlots={mockTimeSlots}
          selectedTime={selectedTime}
          isLoading={false}
          onChange={handleTimeSlotSelect}
          locationsWithDetails={mockLocations}
          onLocationSelect={handleLocationSelect}
          showLocationDetailsPanel={false}
          enableLocationComparison={true}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showLocationBadges={true}
          selectedLocationId={selectedLocation}
          onLocationFilter={handleLocationFilter}
        />

        {/* Mobile-Specific Features Demo */}
        {isMobile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recursos Mobile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Gestos de Deslizar</h4>
                <p className="text-sm text-blue-700">
                  Nos cartões de estabelecimento, deslize para a direita para adicionar à comparação 
                  ou para a esquerda para remover.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Alvos de Toque Otimizados</h4>
                <p className="text-sm text-green-700">
                  Todos os botões têm pelo menos 44px de altura para facilitar o toque em dispositivos móveis.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Layout Adaptativo</h4>
                <p className="text-sm text-purple-700">
                  O layout se adapta automaticamente ao tamanho da tela, empilhando elementos 
                  verticalmente em telas menores.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResponsiveLocationDemo;