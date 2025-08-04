import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeSlotGrid } from '../TimeSlotGrid';
import { LocationWithTimeSlots } from '@/types/location';

// Mock the location components
jest.mock('@/components/location/LocationDetailsPanel', () => ({
  LocationDetailsPanel: ({ locations, onLocationSelect, onLocationFilter }: any) => (
    <div data-testid="location-details-panel">
      <h3>Location Details Panel</h3>
      {locations.map((location: any) => (
        <button
          key={location.id}
          data-testid={`location-${location.id}`}
          onClick={() => {
            onLocationSelect(location.id);
            onLocationFilter(location.id);
          }}
        >
          {location.nome_local}
        </button>
      ))}
    </div>
  )
}));

jest.mock('@/components/location/LocationTimeSlotMapping', () => ({
  LocationTimeSlotMapping: ({ timeSlots, onTimeSlotSelect, onLocationSelect }: any) => (
    <div data-testid="location-time-slot-mapping">
      <h3>Location Time Slot Mapping</h3>
      {timeSlots.map((slot: any) => (
        <button
          key={`${slot.time}-${slot.location_id}`}
          data-testid={`mapping-slot-${slot.time}-${slot.location_id}`}
          onClick={() => {
            onTimeSlotSelect(slot.time, slot.location_id);
            onLocationSelect?.(slot.location_id);
          }}
        >
          {slot.time} - {slot.location_name}
        </button>
      ))}
    </div>
  )
}));

const mockLocationsWithDetails: LocationWithTimeSlots[] = [
  {
    id: 'loc-1',
    nome_local: 'Hospital Central',
    endereco_completo: 'Rua Principal, 123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-000',
    telefone: '(11) 1234-5678',
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
      { type: 'acessibilidade', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2025-01-31T10:00:00Z',
    verificado_em: '2025-01-31T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 5,
    is_open_now: true
  },
  {
    id: 'loc-2',
    nome_local: 'Clínica Norte',
    endereco_completo: 'Av. Norte, 456',
    bairro: 'Vila Norte',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '02000-000',
    telefone: '(11) 9876-5432',
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
      { type: 'estacionamento', available: true, cost: 'pago' },
      { type: 'wifi', available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2025-01-31T10:00:00Z',
    verificado_em: '2025-01-31T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 3,
    is_open_now: true
  }
];

const mockTimeSlots = [
  { time: '09:00', available: true, location_id: 'loc-1', location_name: 'Hospital Central' },
  { time: '10:00', available: true, location_id: 'loc-1', location_name: 'Hospital Central' },
  { time: '11:00', available: true, location_id: 'loc-2', location_name: 'Clínica Norte' },
  { time: '14:00', available: false, location_id: 'loc-1', location_name: 'Hospital Central' },
];

describe('TimeSlotGrid Enhanced Integration', () => {
  const defaultProps = {
    timeSlots: mockTimeSlots,
    selectedTime: '',
    isLoading: false,
    onChange: jest.fn(),
    disabled: false,
    locaisInfo: [],
    selectedLocationId: undefined,
    onLocationFilter: jest.fn(),
    showLocationBadges: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LocationDetailsPanel Integration', () => {
    it('should render LocationDetailsPanel when showLocationDetailsPanel is true', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          showLocationDetailsPanel={true}
        />
      );

      expect(screen.getByTestId('location-details-panel')).toBeInTheDocument();
      expect(screen.getByText('Location Details Panel')).toBeInTheDocument();
    });

    it('should not render LocationDetailsPanel when showLocationDetailsPanel is false', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          showLocationDetailsPanel={false}
        />
      );

      expect(screen.queryByTestId('location-details-panel')).not.toBeInTheDocument();
    });

    it('should handle location selection from LocationDetailsPanel', async () => {
      const onLocationSelect = jest.fn();
      const onLocationFilter = jest.fn();

      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          showLocationDetailsPanel={true}
          onLocationSelect={onLocationSelect}
          onLocationFilter={onLocationFilter}
        />
      );

      const locationButton = screen.getByTestId('location-loc-1');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(onLocationSelect).toHaveBeenCalledWith('loc-1');
        expect(onLocationFilter).toHaveBeenCalledWith('loc-1');
      });
    });
  });

  describe('View Mode Integration', () => {
    it('should render view mode tabs when locations are available', () => {
      const onViewModeChange = jest.fn();

      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          viewMode="grid"
          onViewModeChange={onViewModeChange}
        />
      );

      expect(screen.getByText('Grade')).toBeInTheDocument();
      expect(screen.getByText('Agrupado')).toBeInTheDocument();
      expect(screen.getByText('Matriz')).toBeInTheDocument();
    });

    it('should render LocationTimeSlotMapping in grouped mode', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          viewMode="grouped"
        />
      );

      expect(screen.getByTestId('location-time-slot-mapping')).toBeInTheDocument();
      expect(screen.getByText('Location Time Slot Mapping')).toBeInTheDocument();
    });

    it('should render LocationTimeSlotMapping in matrix mode', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          viewMode="matrix"
        />
      );

      expect(screen.getByTestId('location-time-slot-mapping')).toBeInTheDocument();
    });

    it('should render traditional grid view in grid mode', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          viewMode="grid"
        />
      );

      // Should show traditional time slot buttons
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });
  });

  describe('Location Selection Persistence', () => {
    it('should persist location selection to localStorage', async () => {
      const localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      const onLocationSelect = jest.fn();

      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          showLocationDetailsPanel={true}
          onLocationSelect={onLocationSelect}
        />
      );

      const locationButton = screen.getByTestId('location-loc-1');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(localStorageSetItemSpy).toHaveBeenCalledWith('selectedLocationId', 'loc-1');
      });

      localStorageSetItemSpy.mockRestore();
    });

    it('should persist view mode to localStorage', async () => {
      const localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      const onViewModeChange = jest.fn();

      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          viewMode="grid"
          onViewModeChange={onViewModeChange}
        />
      );

      // Simulate view mode change
      const groupedTab = screen.getByText('Agrupado');
      fireEvent.click(groupedTab);

      await waitFor(() => {
        expect(onViewModeChange).toHaveBeenCalledWith('grouped');
      });

      localStorageSetItemSpy.mockRestore();
    });
  });

  describe('Time Slot Selection with Location Association', () => {
    it('should handle time slot selection with location association', async () => {
      const onChange = jest.fn();
      const onLocationSelect = jest.fn();

      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          viewMode="grouped"
          onChange={onChange}
          onLocationSelect={onLocationSelect}
        />
      );

      const timeSlotButton = screen.getByTestId('mapping-slot-09:00-loc-1');
      fireEvent.click(timeSlotButton);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('09:00');
        expect(onLocationSelect).toHaveBeenCalledWith('loc-1');
      });
    });
  });

  describe('Enhanced Time Slot Buttons', () => {
    it('should show location badges when multiple locations exist', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          showLocationBadges={true}
          viewMode="grid"
        />
      );

      // Time slot buttons should be rendered with location information
      const timeSlotButtons = screen.getAllByRole('button');
      const timeSlotButton = timeSlotButtons.find(button => 
        button.textContent?.includes('09:00')
      );
      
      expect(timeSlotButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('localStorage error');
        });

      const onLocationSelect = jest.fn();

      render(
        <TimeSlotGrid
          {...defaultProps}
          locationsWithDetails={mockLocationsWithDetails}
          showLocationDetailsPanel={true}
          onLocationSelect={onLocationSelect}
        />
      );

      const locationButton = screen.getByTestId('location-loc-1');
      fireEvent.click(locationButton);

      await waitFor(() => {
        expect(onLocationSelect).toHaveBeenCalledWith('loc-1');
        expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to persist location selection:', expect.any(Error));
      });

      localStorageSetItemSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });
});