import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationDetailsPanel } from '@/components/location/LocationDetailsPanel';
import { LocationWithTimeSlots } from '@/types/location';

// Mock data
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
      { time: '09:00', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' },
      { time: '10:00', available: true, location_id: '1', location_name: 'Clínica Central', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med1' }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 2,
    is_open_now: true
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
      { type: 'laboratorio', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '08:00', available: true, location_id: '2', location_name: 'Hospital Norte', duration_minutes: 45, tipo_consulta: 'presencial', medico_id: 'med2' }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'api',
    available_slots_count: 1,
    is_open_now: true
  }
];

describe('LocationDetailsPanel', () => {
  const mockOnLocationSelect = vi.fn();
  const mockOnLocationFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders location cards correctly', () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
      />
    );

    expect(screen.getAllByText('Estabelecimentos Disponíveis')).toHaveLength(2);
    expect(screen.getByText('Clínica Central')).toBeInTheDocument();
    expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <LocationDetailsPanel
        locations={[]}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
        isLoading={true}
      />
    );

    // Should show skeleton loaders - check for skeleton class instead of testid
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('shows empty state when no locations available', () => {
    render(
      <LocationDetailsPanel
        locations={[]}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
        isLoading={false}
      />
    );

    expect(screen.getByText('Nenhum estabelecimento disponível')).toBeInTheDocument();
  });

  it('handles location selection correctly', async () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
      />
    );

    const firstLocationCard = screen.getByText('Clínica Central').closest('[role="button"]');
    expect(firstLocationCard).toBeInTheDocument();

    fireEvent.click(firstLocationCard!);

    await waitFor(() => {
      expect(mockOnLocationSelect).toHaveBeenCalledWith('1');
      expect(mockOnLocationFilter).toHaveBeenCalledWith('1');
    });
  });

  it('filters locations by search query', async () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar por nome ou endereço...');
    fireEvent.change(searchInput, { target: { value: 'Central' } });

    await waitFor(() => {
      expect(screen.getByText('Clínica Central')).toBeInTheDocument();
      expect(screen.queryByText('Hospital Norte')).not.toBeInTheDocument();
    });
  });

  it('shows comparison functionality when enabled', () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
        showComparison={true}
      />
    );

    // Should show comparison instructions
    expect(screen.getByText('Comparar Estabelecimentos')).toBeInTheDocument();
    expect(screen.getByText(/Clique no ícone de olho/)).toBeInTheDocument();
  });

  it('handles sort options correctly', async () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
      />
    );

    const sortSelect = screen.getByRole('combobox');
    fireEvent.click(sortSelect);

    const nameOption = screen.getByText('Nome (A-Z)');
    fireEvent.click(nameOption);

    await waitFor(() => {
      const locationCards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.includes('Estabelecimento')
      );
      expect(locationCards).toHaveLength(2);
    });
  });

  it('shows open only filter', async () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
      />
    );

    const openOnlyButton = screen.getByText('Apenas Abertos');
    fireEvent.click(openOnlyButton);

    // Should still show both locations since they're both open
    expect(screen.getByText('Clínica Central')).toBeInTheDocument();
    expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
  });

  it('clears filters correctly', async () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
      />
    );

    // Apply a search filter
    const searchInput = screen.getByPlaceholderText('Buscar por nome ou endereço...');
    fireEvent.change(searchInput, { target: { value: 'Central' } });

    await waitFor(() => {
      expect(screen.getByText('Limpar Filtros')).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText('Limpar Filtros');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnLocationFilter).toHaveBeenCalledWith(null);
      expect(screen.getByText('Clínica Central')).toBeInTheDocument();
      expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
    });
  });

  it('displays results summary correctly', () => {
    render(
      <LocationDetailsPanel
        locations={mockLocations}
        selectedLocation="1"
        onLocationSelect={mockOnLocationSelect}
        onLocationFilter={mockOnLocationFilter}
      />
    );

    expect(screen.getByText('2 de 2')).toBeInTheDocument();
    expect(screen.getByText('Selecionado')).toBeInTheDocument();
  });
});