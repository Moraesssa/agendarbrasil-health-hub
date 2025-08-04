/**
 * Simple test component to verify accessibility implementations
 */

import React from 'react';
import { LocationCard } from './LocationCard';
import { LocationWithTimeSlots, LocationFacility } from '@/types/location';

// Mock data for testing
const mockLocation: LocationWithTimeSlots = {
  id: 'test-location',
  nome_local: 'Clínica Teste',
  endereco_completo: 'Rua Teste, 123, Centro, São Paulo, SP',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  email: 'teste@clinica.com',
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
    { type: 'estacionamento', available: true, cost: 'gratuito' },
    { type: 'acessibilidade', available: true },
    { type: 'wifi', available: true, cost: 'gratuito' }
  ] as LocationFacility[],
  status: 'ativo',
  available_slots_count: 5,
  horarios_disponiveis: [],
  ultima_atualizacao: new Date().toISOString(),
  is_open_now: true
};

export const AccessibilityTest: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Teste de Acessibilidade</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">LocationCard com Acessibilidade</h2>
        <div className="max-w-md">
          <LocationCard
            location={mockLocation}
            isSelected={selectedLocation === mockLocation.id}
            onSelect={() => setSelectedLocation(mockLocation.id)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-md font-medium">Instruções de Teste:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Use Tab para navegar até o card</li>
          <li>Pressione Enter ou Espaço para selecionar</li>
          <li>Use um leitor de tela para ouvir as descrições</li>
          <li>Teste em modo de alto contraste</li>
          <li>Verifique se funciona em dispositivos touch</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessibilityTest;