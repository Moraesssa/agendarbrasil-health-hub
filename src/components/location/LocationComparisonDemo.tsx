/**
 * LocationComparisonDemo Component
 * Demonstrates the enhanced location comparison functionality
 */

import React, { useState } from 'react';
import { LocationComparison } from './LocationComparison';
import { AdvancedLocationComparison } from './AdvancedLocationComparison';
import { SavedComparisons } from './SavedComparisons';
import { useLocationComparison } from '@/hooks/useLocationComparison';
import { LocationWithTimeSlots } from '@/types/location';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  MapPin, 
  Clock, 
  Star,
  Wifi,
  Car,
  Accessibility,
  TestTube,
  Sparkles
} from 'lucide-react';

// Mock data for demonstration
const mockLocations: LocationWithTimeSlots[] = [
  {
    id: 'loc1',
    nome_local: 'Clínica São Paulo Centro',
    endereco_completo: 'Rua Augusta, 1234',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01305-100',
    telefone: '(11) 3456-7890',
    email: 'contato@clinicacentro.com.br',
    website: 'https://clinicacentro.com.br',
    coordenadas: {
      lat: -23.5505,
      lng: -46.6333,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'pago', details: '50 vagas' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'farmacia', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-30T10:00:00Z',
    verificado_em: '2024-01-30T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 12,
    next_available_slot: '14:30',
    is_open_now: true,
    distance_km: 2.5
  },
  {
    id: 'loc2',
    nome_local: 'Hospital Vila Madalena',
    endereco_completo: 'Rua Harmonia, 567',
    bairro: 'Vila Madalena',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05435-000',
    telefone: '(11) 2345-6789',
    email: 'atendimento@hospitalvm.com.br',
    coordenadas: {
      lat: -23.5505,
      lng: -46.6911,
      precisao: 'exata'
    },
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
      { type: 'estacionamento', available: true, cost: 'gratuito', details: '100 vagas' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'laboratorio', available: true },
      { type: 'farmacia', available: true },
      { type: 'elevador', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-30T09:30:00Z',
    verificado_em: '2024-01-30T09:30:00Z',
    fonte_dados: 'api',
    available_slots_count: 8,
    next_available_slot: '15:00',
    is_open_now: true,
    distance_km: 4.2
  },
  {
    id: 'loc3',
    nome_local: 'Clínica Jardins Premium',
    endereco_completo: 'Av. Paulista, 2000',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    telefone: '(11) 3333-4444',
    email: 'premium@jardins.com.br',
    website: 'https://jardins-premium.com.br',
    coordenadas: {
      lat: -23.5618,
      lng: -46.6565,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '20:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '20:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '20:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '20:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '09:00', fechamento: '15:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito', details: 'Valet' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'cafe', available: true },
      { type: 'ar_condicionado', available: true },
      { type: 'elevador', available: true },
      { type: 'sala_espera_criancas', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-30T11:00:00Z',
    verificado_em: '2024-01-30T11:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 15,
    next_available_slot: '13:00',
    is_open_now: true,
    distance_km: 1.8
  }
];

export const LocationComparisonDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState('comparison');
  const [viewMode, setViewMode] = useState<'standard' | 'advanced'>('standard');
  const { saveComparison, savedComparisons } = useLocationComparison();

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const handleSaveComparison = (comparisonData: any) => {
    saveComparison(comparisonData);
  };

  const handleLoadComparison = (locationIds: string[]) => {
    // In a real implementation, this would load the locations by IDs
    console.log('Loading comparison with location IDs:', locationIds);
    setActiveTab('comparison');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Demonstração da Comparação de Estabelecimentos
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Explore a funcionalidade avançada de comparação de estabelecimentos de saúde, 
          incluindo critérios personalizáveis, compartilhamento e salvamento de comparações.
        </p>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Recursos da Comparação Avançada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Comparação Lado a Lado</h3>
                <p className="text-sm text-blue-700">Compare até 3 estabelecimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <MapPin className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Critérios Personalizáveis</h3>
                <p className="text-sm text-green-700">Filtre por distância, facilidades</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900">Salvamento</h3>
                <p className="text-sm text-purple-700">Salve comparações favoritas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Star className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">Compartilhamento</h3>
                <p className="text-sm text-orange-700">Compartilhe via WhatsApp, email</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparação Padrão</TabsTrigger>
          <TabsTrigger value="advanced">Comparação Avançada</TabsTrigger>
          <TabsTrigger value="saved">Comparações Salvas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="space-y-6">
          {/* Mock Location Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Estabelecimentos Disponíveis para Comparação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockLocations.map((location) => (
                  <div
                    key={location.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleLocationSelect(location.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{location.nome_local}</h3>
                      {selectedLocation === location.id && (
                        <Badge className="bg-blue-100 text-blue-800">Selecionado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{location.endereco_completo}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{location.available_slots_count} horários</span>
                      <MapPin className="h-3 w-3 ml-2" />
                      <span>{location.distance_km}km</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {location.facilidades.slice(0, 3).map((facility) => (
                        <Badge key={facility.type} variant="outline" className="text-xs">
                          {facility.type === 'estacionamento' && <Car className="h-3 w-3 mr-1" />}
                          {facility.type === 'wifi' && <Wifi className="h-3 w-3 mr-1" />}
                          {facility.type === 'acessibilidade' && <Accessibility className="h-3 w-3 mr-1" />}
                          {facility.type === 'laboratorio' && <TestTube className="h-3 w-3 mr-1" />}
                          {facility.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location Comparison */}
          <LocationComparison
            locations={mockLocations}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            onSaveComparison={handleSaveComparison}
            savedComparisons={savedComparisons}
          />
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          {/* Mock Location Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Estabelecimentos Disponíveis para Comparação Avançada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockLocations.map((location) => (
                  <div
                    key={location.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleLocationSelect(location.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{location.nome_local}</h3>
                      {selectedLocation === location.id && (
                        <Badge className="bg-blue-100 text-blue-800">Selecionado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{location.endereco_completo}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{location.available_slots_count} horários</span>
                      <MapPin className="h-3 w-3 ml-2" />
                      <span>{location.distance_km}km</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {location.facilidades.slice(0, 3).map((facility) => (
                        <Badge key={facility.type} variant="outline" className="text-xs">
                          {facility.type === 'estacionamento' && <Car className="h-3 w-3 mr-1" />}
                          {facility.type === 'wifi' && <Wifi className="h-3 w-3 mr-1" />}
                          {facility.type === 'acessibilidade' && <Accessibility className="h-3 w-3 mr-1" />}
                          {facility.type === 'laboratorio' && <TestTube className="h-3 w-3 mr-1" />}
                          {facility.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Location Comparison */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Comparação Avançada com Pontuação Inteligente
              </h3>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Novo!
              </Badge>
            </div>
            <AdvancedLocationComparison
              locations={mockLocations}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              onSaveComparison={handleSaveComparison}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-6">
          <SavedComparisons onLoadComparison={handleLoadComparison} />
        </TabsContent>
      </Tabs>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar a Comparação de Estabelecimentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Comparar Estabelecimentos</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Selecione 2 ou mais estabelecimentos</li>
                <li>• Compare critérios lado a lado</li>
                <li>• Use filtros para personalizar a visualização</li>
                <li>• Veja pontuação automática baseada em critérios</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Salvar e Compartilhar</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Salve comparações para consulta posterior</li>
                <li>• Compartilhe via WhatsApp, email ou SMS</li>
                <li>• Exporte dados em formato JSON</li>
                <li>• Gerencie comparações salvas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationComparisonDemo;