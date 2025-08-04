import React, { useState } from 'react';
import { LocationCard } from './LocationCard';
import { LocationWithTimeSlots } from '@/types/location';

// Demo data for testing the LocationCard component
const demoLocations: LocationWithTimeSlots[] = [
  {
    id: '1',
    nome_local: 'Clínica São Paulo',
    endereco_completo: 'Av. Paulista, 1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    telefone: '(11) 3456-7890',
    email: 'contato@clinicasp.com.br',
    website: 'https://clinicasp.com.br',
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
      { type: 'estacionamento', available: true, cost: 'gratuito', details: '50 vagas disponíveis' },
      { type: 'acessibilidade', available: true, details: 'Rampa de acesso e elevador' },
      { type: 'wifi', available: true },
      { type: 'ar_condicionado', available: true },
      { type: 'farmacia', available: true, details: 'Farmácia 24h no térreo' }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      {
        time: '09:00',
        available: true,
        location_id: '1',
        location_name: 'Clínica São Paulo',
        duration_minutes: 30,
        tipo_consulta: 'presencial',
        medico_id: 'med1'
      }
    ],
    ultima_atualizacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 8,
    is_open_now: true
  },
  {
    id: '2',
    nome_local: 'Centro Médico Vila Madalena',
    endereco_completo: 'Rua Harmonia, 456',
    bairro: 'Vila Madalena',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05435-000',
    telefone: '(11) 2345-6789',
    email: 'atendimento@centromedicovila.com.br',
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
      { type: 'estacionamento', available: true, cost: 'pago', details: 'R$ 5,00 por hora' },
      { type: 'acessibilidade', available: false },
      { type: 'wifi', available: true },
      { type: 'laboratorio', available: true, details: 'Laboratório de análises clínicas' }
    ],
    status: 'temporariamente_fechado',
    motivo_fechamento: 'Reforma nas instalações',
    previsao_reabertura: '15/02/2024',
    horarios_disponiveis: [],
    ultima_atualizacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    verificado_em: new Date().toISOString(),
    fonte_dados: 'api',
    available_slots_count: 0,
    is_open_now: false
  },
  {
    id: '3',
    nome_local: 'Policlínica Jardins',
    endereco_completo: 'Alameda Santos, 789',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01419-000',
    telefone: '(11) 4567-8901',
    email: 'info@policlinicajardins.com.br',
    horario_funcionamento: {
      segunda: { abertura: '06:00', fechamento: '20:00', fechado: false },
      terca: { abertura: '06:00', fechamento: '20:00', fechado: false },
      quarta: { abertura: '06:00', fechamento: '20:00', fechado: false },
      quinta: { abertura: '06:00', fechamento: '20:00', fechado: false },
      sexta: { abertura: '06:00', fechamento: '20:00', fechado: false },
      sabado: { abertura: '07:00', fechamento: '15:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '14:00', fechado: false }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito', details: '100 vagas cobertas' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true },
      { type: 'ar_condicionado', available: true },
      { type: 'farmacia', available: true },
      { type: 'laboratorio', available: true },
      { type: 'elevador', available: true },
      { type: 'cafe', available: true, details: 'Cafeteria no 2º andar' }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      {
        time: '08:00',
        available: true,
        location_id: '3',
        location_name: 'Policlínica Jardins',
        duration_minutes: 30,
        tipo_consulta: 'presencial',
        medico_id: 'med2'
      }
    ],
    ultima_atualizacao: new Date().toISOString(), // Just updated
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 12,
    is_open_now: true
  }
];

export const LocationCardDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(selectedLocation === locationId ? null : locationId);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            LocationCard Component Demo
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Compact Mode</span>
            </label>
          </div>
        </div>

        <div className={`grid gap-6 ${compactMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {demoLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              isSelected={selectedLocation === location.id}
              onSelect={() => handleLocationSelect(location.id)}
              compact={compactMode}
              onViewMap={() => console.log('View map for:', location.nome_local)}
              onCall={() => console.log('Call:', location.telefone)}
              onShare={() => console.log('Share:', location.nome_local)}
            />
          ))}
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Demo Features</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click on cards to select/deselect them</li>
            <li>• Toggle compact mode to see responsive layout</li>
            <li>• Action buttons log to console when clicked</li>
            <li>• Different location statuses are demonstrated</li>
            <li>• Facilities are displayed with tooltips</li>
            <li>• Operating hours show current status</li>
            <li>• Last updated timestamps show relative time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationCardDemo;