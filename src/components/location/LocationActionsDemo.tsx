import React from 'react';
import { LocationActions, useLocationActions } from './LocationActions';
import { LocationWithTimeSlots } from '@/types/location';

// Demo data for testing
const demoLocation: LocationWithTimeSlots = {
  id: 'demo-location-1',
  nome_local: 'Clínica Saúde Total',
  endereco_completo: 'Rua das Flores, 123',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 99999-9999',
  whatsapp: '(11) 99999-9999',
  email: 'contato@saudetotal.com.br',
  website: 'https://saudetotal.com.br',
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
    { type: 'estacionamento', available: true, cost: 'gratuito' },
    { type: 'acessibilidade', available: true },
    { type: 'wifi', available: true, cost: 'gratuito' }
  ],
  status: 'ativo',
  horarios_disponiveis: [
    {
      time: '09:00',
      available: true,
      location_id: 'demo-location-1',
      location_name: 'Clínica Saúde Total',
      duration_minutes: 30,
      tipo_consulta: 'presencial',
      medico_id: 'demo-doctor-1'
    }
  ],
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual',
  available_slots_count: 5,
  next_available_slot: '09:00',
  is_open_now: true
};

export const LocationActionsDemo: React.FC = () => {
  const {
    actionStates,
    lastResults,
    handleActionStart,
    handleActionComplete
  } = useLocationActions(demoLocation);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">
        LocationActions Component Demo
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Horizontal Layout (Default)</h3>
          <LocationActions
            location={demoLocation}
            appointmentTime="2024-02-15 09:00"
            onActionStart={handleActionStart}
            onActionComplete={handleActionComplete}
          />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Compact Horizontal</h3>
          <LocationActions
            location={demoLocation}
            compact={true}
            onActionStart={handleActionStart}
            onActionComplete={handleActionComplete}
          />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Vertical Layout</h3>
          <LocationActions
            location={demoLocation}
            orientation="vertical"
            onActionStart={handleActionStart}
            onActionComplete={handleActionComplete}
          />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Without Phone</h3>
          <LocationActions
            location={{
              ...demoLocation,
              telefone: undefined,
              whatsapp: undefined
            }}
            onActionStart={handleActionStart}
            onActionComplete={handleActionComplete}
          />
        </div>
      </div>

      {/* Action States Debug Info */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Action States (Debug)</h3>
        <pre className="text-sm text-gray-600">
          {JSON.stringify({ actionStates, lastResults }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default LocationActionsDemo;