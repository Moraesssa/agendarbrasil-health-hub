import React, { useState } from 'react';
import { LocationTimeSlotMapping } from './LocationTimeSlotMapping';
import { EnhancedTimeSlot, LocationWithTimeSlots, LocationFacility } from '@/types/location';

// Mock data for demonstration
const mockLocations: LocationWithTimeSlots[] = [
  {
    id: 'loc-1',
    nome_local: 'Clínica São Paulo - Unidade Centro',
    endereco_completo: 'Rua Augusta, 1234 - Centro, São Paulo - SP, 01305-100',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01305-100',
    telefone: '(11) 3456-7890',
    email: 'centro@clinicasp.com.br',
    website: 'https://clinicasp.com.br',
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
      { type: 'estacionamento', available: true, cost: 'pago', details: '50 vagas disponíveis' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'ar_condicionado', available: true },
      { type: 'farmacia', available: true }
    ] as LocationFacility[],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-15T10:00:00Z',
    verificado_em: '2024-01-15T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 8,
    is_open_now: true,
    distance_km: 2.5
  },
  {
    id: 'loc-2',
    nome_local: 'Clínica São Paulo - Unidade Jardins',
    endereco_completo: 'Av. Paulista, 2000 - Jardins, São Paulo - SP, 01310-100',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    telefone: '(11) 3456-7891',
    email: 'jardins@clinicasp.com.br',
    website: 'https://clinicasp.com.br',
    coordenadas: {
      lat: -23.5618,
      lng: -46.6565,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '07:00', fechamento: '19:00', fechado: false },
      terca: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quarta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quinta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sexta: { abertura: '07:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '14:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito', details: '30 vagas disponíveis' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'ar_condicionado', available: true },
      { type: 'laboratorio', available: true },
      { type: 'elevador', available: true }
    ] as LocationFacility[],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-15T10:00:00Z',
    verificado_em: '2024-01-15T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 12,
    is_open_now: true,
    distance_km: 1.8
  },
  {
    id: 'loc-3',
    nome_local: 'Clínica São Paulo - Unidade Vila Madalena',
    endereco_completo: 'Rua Harmonia, 500 - Vila Madalena, São Paulo - SP, 05435-000',
    bairro: 'Vila Madalena',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05435-000',
    telefone: '(11) 3456-7892',
    email: 'vilamadalena@clinicasp.com.br',
    coordenadas: {
      lat: -23.5440,
      lng: -46.6929,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '17:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '17:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '16:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: false },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true, cost: 'gratuito' },
      { type: 'ar_condicionado', available: true },
      { type: 'cafe', available: true }
    ] as LocationFacility[],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-15T10:00:00Z',
    verificado_em: '2024-01-15T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 6,
    is_open_now: true,
    distance_km: 4.2
  }
];

const mockTimeSlots: EnhancedTimeSlot[] = [
  // Centro
  { time: '08:00', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '08:30', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '09:00', available: false, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '09:30', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '10:00', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '14:00', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '14:30', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '15:00', available: true, location_id: 'loc-1', location_name: 'Clínica São Paulo - Unidade Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  
  // Jardins
  { time: '07:00', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '07:30', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '08:00', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '08:30', available: false, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '09:00', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '09:30', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '10:00', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '16:00', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '16:30', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '17:00', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '17:30', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '18:00', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '18:30', available: true, location_id: 'loc-2', location_name: 'Clínica São Paulo - Unidade Jardins', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  
  // Vila Madalena
  { time: '08:00', available: true, location_id: 'loc-3', location_name: 'Clínica São Paulo - Unidade Vila Madalena', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '08:30', available: true, location_id: 'loc-3', location_name: 'Clínica São Paulo - Unidade Vila Madalena', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '09:00', available: true, location_id: 'loc-3', location_name: 'Clínica São Paulo - Unidade Vila Madalena', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '14:00', available: false, location_id: 'loc-3', location_name: 'Clínica São Paulo - Unidade Vila Madalena', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '14:30', available: true, location_id: 'loc-3', location_name: 'Clínica São Paulo - Unidade Vila Madalena', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '15:00', available: true, location_id: 'loc-3', location_name: 'Clínica São Paulo - Unidade Vila Madalena', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' },
  { time: '15:30', available: true, location_id: 'loc-3', location_name: 'Clínica São Paulo - Unidade Vila Madalena', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med-1' }
];

export const LocationTimeSlotMappingDemo: React.FC = () => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const handleTimeSlotSelect = (timeSlot: string, locationId: string) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedLocationId(locationId);
    console.log('Selected:', { timeSlot, locationId });
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    console.log('Location selected:', locationId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          LocationTimeSlotMapping Demo
        </h1>
        <p className="text-gray-600">
          Demonstração do componente de mapeamento de horários por estabelecimento
        </p>
      </div>

      {/* Selection Status */}
      {(selectedTimeSlot || selectedLocationId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Seleção Atual:</h3>
          <div className="space-y-1 text-sm text-blue-800">
            {selectedTimeSlot && (
              <p><strong>Horário:</strong> {selectedTimeSlot}</p>
            )}
            {selectedLocationId && (
              <p><strong>Estabelecimento:</strong> {mockLocations.find(l => l.id === selectedLocationId)?.nome_local}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Component */}
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        selectedTimeSlot={selectedTimeSlot}
        selectedLocationId={selectedLocationId}
        onTimeSlotSelect={handleTimeSlotSelect}
        onLocationSelect={handleLocationSelect}
        groupByLocation={true}
        showMatrix={true}
      />

      {/* Usage Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Como usar:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• <strong>Visualização Agrupada:</strong> Veja horários organizados por estabelecimento</li>
          <li>• <strong>Visualização em Matriz:</strong> Compare horários disponíveis em todos os estabelecimentos</li>
          <li>• <strong>Visualização em Lista:</strong> Veja todos os horários disponíveis em ordem cronológica</li>
          <li>• <strong>Filtros:</strong> Filtre horários por estabelecimento específico</li>
          <li>• <strong>Preferências:</strong> Configure estabelecimentos preferidos</li>
          <li>• <strong>Seleção:</strong> Clique em qualquer horário para selecioná-lo</li>
        </ul>
      </div>

      {/* Features Showcase */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">✅ Funcionalidades Implementadas</h4>
          <ul className="space-y-1 text-sm text-green-800">
            <li>• Agrupamento de horários por localização</li>
            <li>• Filtros por estabelecimento</li>
            <li>• Visualização em matriz de disponibilidade</li>
            <li>• Sistema de preferências de localização</li>
            <li>• Múltiplas visualizações (agrupada, matriz, lista)</li>
            <li>• Estatísticas de disponibilidade</li>
            <li>• Interface responsiva</li>
            <li>• Persistência de preferências</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">🎯 Casos de Uso</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Comparar disponibilidade entre estabelecimentos</li>
            <li>• Encontrar horários em locais preferidos</li>
            <li>• Visualizar padrões de disponibilidade</li>
            <li>• Filtrar por proximidade ou facilidades</li>
            <li>• Agendar em múltiplas unidades</li>
            <li>• Otimizar escolha de horário e local</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationTimeSlotMappingDemo;