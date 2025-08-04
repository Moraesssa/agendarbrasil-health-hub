import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationComparison } from '@/components/location/LocationComparison';
import { LocationWithTimeSlots } from '@/types/location';

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
    email: 'contato@clinicacentral.com',
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
      { type: 'estacionamento', available: true, cost: 'gratuito' },
      { type: 'acessibilidade', available: true },
      { type: 'wifi', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '09:00', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' },
      { time: '10:00', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 2,
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
    coordenadas: { lat: -23.5405, lng: -46.6233, precisao: 'exata' },
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
      { type: 'estacionamento', available: true, cost: 'pago' },
      { type: 'farmacia', available: true },
      { type: 'laboratorio', available: true },
      { type: 'acessibilidade', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '08:00', available: true, location_id: '2', location_name: 'Hospital Norte', duration_minutes: 45, tipo_consulta: 'presencial', medico_id: 'med2' }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'api',
    available_slots_count: 1,
    is_open_now: true,
    distance_km: 5.2
  }
];

describe('LocationComparison', () => {
  it('renders comparison table with location data', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    expect(screen.getByText('Comparar Estabelecimentos')).toBeInTheDocument();
    expect(screen.getByText('Clínica Central')).toBeInTheDocument();
    expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
  });

  it('displays location addresses correctly', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument();
    expect(screen.getByText('Av. Principal, 456')).toBeInTheDocument();
  });

  it('shows distance information', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    expect(screen.getByText('2.5 km')).toBeInTheDocument();
    expect(screen.getByText('5.2 km')).toBeInTheDocument();
  });

  it('displays available time slots count', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    expect(screen.getByText('2 horários')).toBeInTheDocument();
    expect(screen.getByText('1 horário')).toBeInTheDocument();
  });

  it('shows facility comparison', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    expect(screen.getByText('Facilidades')).toBeInTheDocument();
    
    // Should show facility counts or icons
    const facilityRows = screen.getAllByText(/facilidades?/i);
    expect(facilityRows.length).toBeGreaterThan(0);
  });

  it('displays operating hours comparison', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    expect(screen.getByText('Horário de Funcionamento')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 18:00')).toBeInTheDocument();
    expect(screen.getByText('07:00 - 19:00')).toBeInTheDocument();
  });

  it('handles location selection', async () => {
    const onLocationSelect = vi.fn();
    render(<LocationComparison locations={mockLocations} onLocationSelect={onLocationSelect} />);
    
    const selectButton = screen.getAllByText('Selecionar')[0];
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      expect(onLocationSelect).toHaveBeenCalledWith('1');
    });
  });

  it('highlights selected location', () => {
    render(<LocationComparison locations={mockLocations} selectedLocationId="1" />);
    
    const selectedColumn = screen.getByText('Clínica Central').closest('.location-column');
    expect(selectedColumn).toHaveClass('border-blue-500');
  });

  it('shows "Melhor Opção" indicator', () => {
    render(<LocationComparison locations={mockLocations} showRecommendation={true} />);
    
    // Should show recommendation based on criteria (closest, most available, etc.)
    expect(screen.getByText('Melhor Opção')).toBeInTheDocument();
  });

  it('allows toggling between standard and advanced view', async () => {
    render(<LocationComparison locations={mockLocations} />);
    
    const advancedToggle = screen.getByText('Visão Avançada');
    fireEvent.click(advancedToggle);
    
    await waitFor(() => {
      expect(screen.getByText('Pontuação Geral')).toBeInTheDocument();
    });
  });

  it('exports comparison data', async () => {
    render(<LocationComparison locations={mockLocations} />);
    
    const exportButton = screen.getByText('Exportar');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Imprimir')).toBeInTheDocument();
    });
  });

  it('shares comparison via different methods', async () => {
    render(<LocationComparison locations={mockLocations} />);
    
    const shareButton = screen.getByText('Compartilhar');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Copiar Link')).toBeInTheDocument();
    });
  });

  it('handles empty locations array', () => {
    render(<LocationComparison locations={[]} />);
    
    expect(screen.getByText('Selecione pelo menos 2 estabelecimentos para comparar')).toBeInTheDocument();
  });

  it('handles single location', () => {
    render(<LocationComparison locations={[mockLocations[0]]} />);
    
    expect(screen.getByText('Selecione pelo menos 2 estabelecimentos para comparar')).toBeInTheDocument();
  });

  it('limits comparison to maximum locations', () => {
    const manyLocations = Array.from({ length: 6 }, (_, i) => ({
      ...mockLocations[0],
      id: `${i + 1}`,
      nome_local: `Clínica ${i + 1}`
    }));
    
    render(<LocationComparison locations={manyLocations} />);
    
    // Should show warning about too many locations
    expect(screen.getByText(/máximo de 4 estabelecimentos/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    const comparisonTable = screen.getByRole('table');
    expect(comparisonTable).toHaveAttribute('aria-label', 'Comparação de estabelecimentos');
    
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);
  });

  it('supports keyboard navigation', () => {
    render(<LocationComparison locations={mockLocations} />);
    
    const selectButtons = screen.getAllByText('Selecionar');
    selectButtons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  it('shows loading state', () => {
    render(<LocationComparison locations={mockLocations} isLoading={true} />);
    
    expect(screen.getByText('Carregando comparação...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    render(<LocationComparison locations={mockLocations} error="Erro ao carregar dados" />);
    
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
  });
});