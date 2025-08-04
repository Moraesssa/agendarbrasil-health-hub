import React, { useState } from 'react';
import { LocationDetailsPanel } from './LocationDetailsPanel';
import { LocationWithTimeSlots } from '@/types/location';

// Example usage of LocationDetailsPanel component
// This shows how it would integrate with the TimeSlotGrid

const mockLocations: LocationWithTimeSlots[] = [
  {
    id: '1',
    nome_local: 'Clínica Central',
    endereco_completo: 'Rua das Flores, 123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    telefone: '(11) 1234-5678',
    email: 'contato@clinicacentral.com.br',
    website: 'https://clinicacentral.com.br',
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
      sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito', details: '50 vagas disponíveis' },
      { type: 'acessibilidade', available: true, details: 'Rampa de acesso e elevador' },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'ar_condicionado', available: true },
      { type: 'cafe', available: true, details: 'Lanchonete no térreo' }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '09:00', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' },
      { time: '10:00', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' },
      { time: '14:00', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' },
      { time: '15:30', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 4,
    next_available_slot: '09:00',
    is_open_now: true,
    distance_km: 2.5
  },
  {
    id: '2',
    nome_local: 'Hospital Norte',
    endereco_completo: 'Av. Principal, 456',
    bairro: 'Vila Nova',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '02345-678',
    telefone: '(11) 2345-6789',
    whatsapp: '(11) 99999-9999',
    coordenadas: {
      lat: -23.5200,
      lng: -46.6100,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '07:00', fechamento: '19:00', fechado: false },
      terca: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quarta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quinta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sexta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sabado: { abertura: '07:00', fechamento: '15:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'pago', details: 'R$ 5,00 por hora' },
      { type: 'farmacia', available: true, details: 'Farmácia 24h no térreo' },
      { type: 'laboratorio', available: true, details: 'Laboratório de análises clínicas' },
      { type: 'elevador', available: true },
      { type: 'acessibilidade', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '08:00', available: true, location_id: '2', location_name: 'Hospital Norte', duration_minutes: 45, tipo_consulta: 'presencial', medico_id: 'med2' },
      { time: '11:00', available: true, location_id: '2', location_name: 'Hospital Norte', duration_minutes: 45, tipo_consulta: 'presencial', medico_id: 'med2' }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'api',
    available_slots_count: 2,
    next_available_slot: '08:00',
    is_open_now: true,
    distance_km: 5.2
  },
  {
    id: '3',
    nome_local: 'Consultório Dr. Silva',
    endereco_completo: 'Rua das Palmeiras, 789',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '03456-789',
    telefone: '(11) 3456-7890',
    horario_funcionamento: {
      segunda: { abertura: '09:00', fechamento: '17:00', fechado: false },
      terca: { abertura: '09:00', fechamento: '17:00', fechado: false },
      quarta: { abertura: '09:00', fechamento: '17:00', fechado: false },
      quinta: { abertura: '09:00', fechamento: '17:00', fechado: false },
      sexta: { abertura: '09:00', fechamento: '17:00', fechado: false },
      sabado: { abertura: '09:00', fechamento: '12:00', fechado: true },
      domingo: { abertura: '09:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'ar_condicionado', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' }
    ],
    status: 'temporariamente_fechado',
    motivo_fechamento: 'Reforma nas instalações',
    previsao_reabertura: '15/02/2025',
    horarios_disponiveis: [],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 0,
    is_open_now: false,
    distance_km: 1.8
  }
];

export const LocationDetailsPanelExample: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>();
  const [filteredLocationId, setFilteredLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    console.log('Location selected:', locationId);
  };

  const handleLocationFilter = (locationId: string | null) => {
    setFilteredLocationId(locationId);
    console.log('Location filter applied:', locationId);
  };

  const handleLoadingToggle = () => {
    setIsLoading(!isLoading);
  };

  const handleClearSelection = () => {
    setSelectedLocation(undefined);
    setFilteredLocationId(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          LocationDetailsPanel - Exemplo de Uso
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Este componente exibe informações detalhadas dos estabelecimentos de saúde 
          durante o processo de agendamento, permitindo busca, filtros e comparação.
        </p>
        
        {/* Control buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleLoadingToggle}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLoading ? 'Parar Loading' : 'Simular Loading'}
          </button>
          <button
            onClick={handleClearSelection}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Limpar Seleção
          </button>
        </div>

        {/* Status display */}
        {selectedLocation && (
          <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
            <p className="text-green-800">
              <strong>Estabelecimento selecionado:</strong> {selectedLocation}
            </p>
            {filteredLocationId && (
              <p className="text-green-700 mt-1">
                <strong>Filtro ativo:</strong> {filteredLocationId}
              </p>
            )}
          </div>
        )}
      </div>

      {/* LocationDetailsPanel Component */}
      <LocationDetailsPanel
        locations={mockLocations}
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
        onLocationFilter={handleLocationFilter}
        showComparison={true}
        isLoading={isLoading}
      />

      {/* Usage information */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Funcionalidades Implementadas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">✅ Layout e Interface</h3>
            <ul className="space-y-1">
              <li>• Grid responsivo para cards de localização</li>
              <li>• Loading skeleton durante carregamento</li>
              <li>• Estado vazio quando não há localizações</li>
              <li>• Interface limpa e organizada</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">✅ Busca e Filtros</h3>
            <ul className="space-y-1">
              <li>• Busca por nome ou endereço</li>
              <li>• Ordenação por múltiplos critérios</li>
              <li>• Filtro "Apenas Abertos"</li>
              <li>• Limpeza de filtros</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">✅ Seleção e Interação</h3>
            <ul className="space-y-1">
              <li>• Seleção de estabelecimento</li>
              <li>• Filtro por localização específica</li>
              <li>• Feedback visual de seleção</li>
              <li>• Callbacks para integração</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">✅ Comparação</h3>
            <ul className="space-y-1">
              <li>• Seleção de até 3 estabelecimentos</li>
              <li>• Comparação lado a lado</li>
              <li>• Tabela detalhada de comparação</li>
              <li>• Ações rápidas na comparação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailsPanelExample;