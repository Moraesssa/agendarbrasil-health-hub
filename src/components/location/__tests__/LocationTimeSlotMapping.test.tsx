import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocationTimeSlotMapping } from '../LocationTimeSlotMapping';
import { EnhancedTimeSlot, LocationWithTimeSlots } from '@/types/location';

// Mock data for testing
const mockLocations: LocationWithTimeSlots[] = [
  {
    id: 'loc-1',
    nome_local: 'Clínica Centro',
    endereco_completo: 'Rua A, 123 - Centro',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-000',
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-15T10:00:00Z',
    verificado_em: '2024-01-15T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 3,
    is_open_now: true
  },
  {
    id: 'loc-2',
    nome_local: 'Clínica Jardins',
    endereco_completo: 'Av. B, 456 - Jardins',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-001',
    horario_funcionamento: {
      segunda: { abertura: '07:00', fechamento: '19:00', fechado: false },
      terca: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quarta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quinta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sexta: { abertura: '07:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '14:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [],
    status: 'ativo',
    horarios_disponiveis: [],
    ultima_atualizacao: '2024-01-15T10:00:00Z',
    verificado_em: '2024-01-15T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 2,
    is_open_now: true
  }
];

const mockTimeSlots: EnhancedTimeSlot[] = [
  {
    time: '08:00',
    available: true,
    location_id: 'loc-1',
    location_name: 'Clínica Centro',
    duration_minutes: 30,
    tipo_consulta: 'presencial',
    medico_id: 'med-1'
  },
  {
    time: '09:00',
    available: true,
    location_id: 'loc-1',
    location_name: 'Clínica Centro',
    duration_minutes: 30,
    tipo_consulta: 'presencial',
    medico_id: 'med-1'
  },
  {
    time: '10:00',
    available: false,
    location_id: 'loc-1',
    location_name: 'Clínica Centro',
    duration_minutes: 30,
    tipo_consulta: 'presencial',
    medico_id: 'med-1'
  },
  {
    time: '08:00',
    available: true,
    location_id: 'loc-2',
    location_name: 'Clínica Jardins',
    duration_minutes: 30,
    tipo_consulta: 'presencial',
    medico_id: 'med-1'
  },
  {
    time: '14:00',
    available: true,
    location_id: 'loc-2',
    location_name: 'Clínica Jardins',
    duration_minutes: 30,
    tipo_consulta: 'presencial',
    medico_id: 'med-1'
  }
];

const mockOnTimeSlotSelect = vi.fn();
const mockOnLocationSelect = vi.fn();

describe('LocationTimeSlotMapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders component with locations and time slots', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        onLocationSelect={mockOnLocationSelect}
      />
    );

    expect(screen.getByText('Horários por Estabelecimento')).toBeInTheDocument();
    expect(screen.getByText('Clínica Centro')).toBeInTheDocument();
    expect(screen.getByText('Clínica Jardins')).toBeInTheDocument();
  });

  it('displays correct statistics', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        onLocationSelect={mockOnLocationSelect}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Number of locations
    expect(screen.getByText('4')).toBeInTheDocument(); // Available time slots
    expect(screen.getByText('Estabelecimentos')).toBeInTheDocument();
    expect(screen.getByText('Horários Disponíveis')).toBeInTheDocument();
  });

  it('calls onTimeSlotSelect when time slot is clicked', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        onLocationSelect={mockOnLocationSelect}
      />
    );

    const timeSlotButtons = screen.getAllByText('08:00');
    fireEvent.click(timeSlotButtons[0]);

    expect(mockOnTimeSlotSelect).toHaveBeenCalledWith('08:00', 'loc-1');
  });

  it('switches between view modes', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        onLocationSelect={mockOnLocationSelect}
      />
    );

    // Switch to matrix view
    const matrixTab = screen.getByText('Matriz');
    fireEvent.click(matrixTab);

    // Should show table headers
    expect(screen.getByText('Estabelecimento')).toBeInTheDocument();

    // Switch to list view
    const listTab = screen.getByText('Lista');
    fireEvent.click(listTab);

    // Should show available slots in list format
    expect(screen.getByText('Disponível')).toBeInTheDocument();
  });

  it('filters time slots by location', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        onLocationSelect={mockOnLocationSelect}
      />
    );

    // Click filter button for first location
    const filterButtons = screen.getAllByText('Filtrar');
    fireEvent.click(filterButtons[0]);

    // Should show filtered indicator
    expect(screen.getByText(/Filtrado:/)).toBeInTheDocument();
  });

  it('shows empty state when no time slots available', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={[]}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        onLocationSelect={mockOnLocationSelect}
      />
    );

    expect(screen.getByText('Nenhum horário disponível')).toBeInTheDocument();
    expect(screen.getByText('Selecione uma data diferente ou tente outro médico')).toBeInTheDocument();
  });

  it('manages location preferences', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        onLocationSelect={mockOnLocationSelect}
      />
    );

    // Open preferences panel
    const preferencesButton = screen.getByText('Preferências');
    fireEvent.click(preferencesButton);

    expect(screen.getByText('Preferências de Localização')).toBeInTheDocument();
    expect(screen.getByText('Selecionar automaticamente estabelecimentos preferidos')).toBeInTheDocument();
  });
});