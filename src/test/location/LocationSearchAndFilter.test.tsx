import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationSearchAndFilter } from '@/components/location/LocationSearchAndFilter';
import { LocationWithTimeSlots, LocationFilters } from '@/types/location';

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
    horarios_disponiveis: [],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual',
    available_slots_count: 5,
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
      { type: 'laboratorio', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'api',
    available_slots_count: 3,
    is_open_now: true,
    distance_km: 5.2
  }
];

describe('LocationSearchAndFilter', () => {
  const mockOnFilterChange = vi.fn();
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and filter options', () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    expect(screen.getByPlaceholderText('Buscar por nome ou endereço...')).toBeInTheDocument();
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar por nome ou endereço...');
    fireEvent.change(searchInput, { target: { value: 'Central' } });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('Central');
    });
  });

  it('shows quick filter presets', () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    expect(screen.getByText('Próximos')).toBeInTheDocument();
    expect(screen.getByText('Disponíveis')).toBeInTheDocument();
    expect(screen.getByText('Acessíveis')).toBeInTheDocument();
    expect(screen.getByText('Com Estacionamento')).toBeInTheDocument();
  });

  it('applies quick filter presets', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const nearbyFilter = screen.getByText('Próximos');
    fireEvent.click(nearbyFilter);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          max_distance_km: 5
        })
      );
    });
  });

  it('shows facility filter options', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const filtersTab = screen.getByText('Filtros');
    fireEvent.click(filtersTab);

    await waitFor(() => {
      expect(screen.getByText('Facilidades')).toBeInTheDocument();
      expect(screen.getByText('Estacionamento')).toBeInTheDocument();
      expect(screen.getByText('Acessibilidade')).toBeInTheDocument();
      expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    });
  });

  it('handles facility filter selection', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const filtersTab = screen.getByText('Filtros');
    fireEvent.click(filtersTab);

    const parkingFilter = await screen.findByText('Estacionamento');
    fireEvent.click(parkingFilter);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          facilidades: ['estacionamento']
        })
      );
    });
  });

  it('shows distance filter slider', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const filtersTab = screen.getByText('Filtros');
    fireEvent.click(filtersTab);

    await waitFor(() => {
      expect(screen.getByText('Distância Máxima')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  it('handles distance filter changes', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const filtersTab = screen.getByText('Filtros');
    fireEvent.click(filtersTab);

    const distanceSlider = await screen.findByRole('slider');
    fireEvent.change(distanceSlider, { target: { value: '10' } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          max_distance_km: 10
        })
      );
    });
  });

  it('shows operating hours filter', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const filtersTab = screen.getByText('Filtros');
    fireEvent.click(filtersTab);

    await waitFor(() => {
      expect(screen.getByText('Horário de Funcionamento')).toBeInTheDocument();
      expect(screen.getByText('Apenas Abertos Agora')).toBeInTheDocument();
    });
  });

  it('shows sorting options', () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    expect(screen.getByText('Ordenar por')).toBeInTheDocument();
    
    const sortSelect = screen.getByRole('combobox');
    fireEvent.click(sortSelect);

    expect(screen.getByText('Distância')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Disponibilidade')).toBeInTheDocument();
  });

  it('handles sort option changes', async () => {
    const mockOnSortChange = vi.fn();
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
        onSortChange={mockOnSortChange}
      />
    );

    const sortSelect = screen.getByRole('combobox');
    fireEvent.click(sortSelect);

    const distanceOption = screen.getByText('Distância');
    fireEvent.click(distanceOption);

    await waitFor(() => {
      expect(mockOnSortChange).toHaveBeenCalledWith('distance', 'asc');
    });
  });

  it('shows saved preferences tab', async () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const preferencesTab = screen.getByText('Preferências');
    fireEvent.click(preferencesTab);

    await waitFor(() => {
      expect(screen.getByText('Preferências Salvas')).toBeInTheDocument();
      expect(screen.getByText('Salvar Busca Atual')).toBeInTheDocument();
    });
  });

  it('saves current search preferences', async () => {
    const mockOnSavePreferences = vi.fn();
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
        onSavePreferences={mockOnSavePreferences}
      />
    );

    const preferencesTab = screen.getByText('Preferências');
    fireEvent.click(preferencesTab);

    const saveButton = await screen.findByText('Salvar Busca Atual');
    fireEvent.click(saveButton);

    const nameInput = await screen.findByPlaceholderText('Nome da preferência...');
    fireEvent.change(nameInput, { target: { value: 'Minha Busca' } });

    const confirmButton = screen.getByText('Salvar');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSavePreferences).toHaveBeenCalledWith(
        'Minha Busca',
        expect.any(Object)
      );
    });
  });

  it('loads saved preferences', async () => {
    const savedPreferences = [
      {
        id: '1',
        name: 'Próximos com Estacionamento',
        filters: { max_distance_km: 5, facilidades: ['estacionamento'] },
        created_at: new Date().toISOString()
      }
    ];

    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
        savedPreferences={savedPreferences}
      />
    );

    const preferencesTab = screen.getByText('Preferências');
    fireEvent.click(preferencesTab);

    const savedPreference = await screen.findByText('Próximos com Estacionamento');
    fireEvent.click(savedPreference);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          max_distance_km: 5,
          facilidades: ['estacionamento']
        })
      );
    });
  });

  it('shows results counter', () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    expect(screen.getByText('2 estabelecimentos encontrados')).toBeInTheDocument();
  });

  it('shows active filters summary', async () => {
    const activeFilters: LocationFilters = {
      facilidades: ['estacionamento'],
      max_distance_km: 10,
      open_now: true
    };

    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
        activeFilters={activeFilters}
      />
    );

    expect(screen.getByText('Estacionamento')).toBeInTheDocument();
    expect(screen.getByText('Até 10km')).toBeInTheDocument();
    expect(screen.getByText('Abertos agora')).toBeInTheDocument();
  });

  it('clears all filters', async () => {
    const activeFilters: LocationFilters = {
      facilidades: ['estacionamento'],
      max_distance_km: 10
    };

    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
        activeFilters={activeFilters}
      />
    );

    const clearButton = screen.getByText('Limpar Filtros');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({});
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar por nome ou endereço...');
    expect(searchInput).toHaveAttribute('aria-label', 'Buscar estabelecimentos');

    const filterTabs = screen.getAllByRole('tab');
    expect(filterTabs.length).toBeGreaterThan(0);
  });

  it('supports keyboard navigation', () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar por nome ou endereço...');
    expect(searchInput).toHaveAttribute('tabIndex', '0');

    const quickFilters = screen.getAllByRole('button');
    quickFilters.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  it('shows loading state', () => {
    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
        isLoading={true}
      />
    );

    expect(screen.getByText('Buscando...')).toBeInTheDocument();
  });

  it('handles mobile responsive layout', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <LocationSearchAndFilter
        locations={mockLocations}
        onFilterChange={mockOnFilterChange}
        onSearch={mockOnSearch}
      />
    );

    // Should show mobile-optimized layout
    const container = screen.getByRole('search');
    expect(container).toHaveClass('mobile-layout');
  });
});