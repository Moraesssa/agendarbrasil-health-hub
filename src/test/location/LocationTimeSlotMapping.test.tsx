import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationTimeSlotMapping } from '@/components/location/LocationTimeSlotMapping';
import { LocationWithTimeSlots, EnhancedTimeSlot } from '@/types/location';

const mockTimeSlots: EnhancedTimeSlot[] = [
  {
    time: '09:00',
    available: true,
    location_id: '1',
    location_name: 'Clínica Central',
    duration_minutes: 30,
    tipo_consulta: 'presencial',
    medico_id: 'med1'
  },
  {
    time: '10:00',
    available: true,
    location_id: '1',
    location_name: 'Clínica Central',
    duration_minutes: 30,
    tipo_consulta: 'presencial',
    medico_id: 'med1'
  },
  {
    time: '09:00',
    available: true,
    location_id: '2',
    location_name: 'Hospital Norte',
    duration_minutes: 45,
    tipo_consulta: 'presencial',
    medico_id: 'med2'
  },
  {
    time: '11:00',
    available: true,
    location_id: '2',
    location_name: 'Hospital Norte',
    duration_minutes: 45,
    tipo_consulta: 'presencial',
    medico_id: 'med2'
  }
];

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
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [],
    status: 'ativo',
    horarios_disponiveis: mockTimeSlots.filter(slot => slot.location_id === '1'),
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
    facilidades: [],
    status: 'ativo',
    horarios_disponiveis: mockTimeSlots.filter(slot => slot.location_id === '2'),
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'api',
    available_slots_count: 2,
    is_open_now: true
  }
];

describe('LocationTimeSlotMapping', () => {
  const mockOnTimeSlotSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders time slots grouped by location', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        groupByLocation={true}
      />
    );

    expect(screen.getByText('Clínica Central')).toBeInTheDocument();
    expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
  });

  it('displays time slots in chronological order', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
      />
    );

    const timeSlotButtons = screen.getAllByRole('button');
    const times = timeSlotButtons.map(button => button.textContent?.match(/\d{2}:\d{2}/)?.[0]);
    
    // Should be in chronological order
    expect(times).toEqual(['09:00', '09:00', '10:00', '11:00']);
  });

  it('shows location badges on time slot buttons', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        showLocationBadges={true}
      />
    );

    expect(screen.getByText('Clínica Central')).toBeInTheDocument();
    expect(screen.getByText('Hospital Norte')).toBeInTheDocument();
  });

  it('handles time slot selection', async () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
      />
    );

    const firstTimeSlot = screen.getAllByRole('button')[0];
    fireEvent.click(firstTimeSlot);

    await waitFor(() => {
      expect(mockOnTimeSlotSelect).toHaveBeenCalledWith('09:00', '1');
    });
  });

  it('highlights selected time slot', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        selectedTimeSlot="09:00"
      />
    );

    const selectedSlots = screen.getAllByRole('button').filter(button => 
      button.classList.contains('bg-blue-500')
    );
    expect(selectedSlots.length).toBeGreaterThan(0);
  });

  it('filters time slots by location', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        filteredLocationId="1"
      />
    );

    // Should only show time slots for location 1
    const timeSlotButtons = screen.getAllByRole('button');
    expect(timeSlotButtons).toHaveLength(2); // Only slots for Clínica Central
  });

  it('shows matrix view when enabled', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        viewMode="matrix"
      />
    );

    // Should show a grid layout
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('displays availability indicators', () => {
    const mixedTimeSlots = [
      ...mockTimeSlots,
      {
        time: '14:00',
        available: false,
        location_id: '1',
        location_name: 'Clínica Central',
        duration_minutes: 30,
        tipo_consulta: 'presencial',
        medico_id: 'med1'
      }
    ];

    render(
      <LocationTimeSlotMapping
        timeSlots={mixedTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
      />
    );

    const unavailableSlot = screen.getByText('14:00').closest('button');
    expect(unavailableSlot).toBeDisabled();
  });

  it('shows duration information', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        showDuration={true}
      />
    );

    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('handles empty time slots', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={[]}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
      />
    );

    expect(screen.getByText('Nenhum horário disponível')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        isLoading={true}
      />
    );

    expect(screen.getByText('Carregando horários...')).toBeInTheDocument();
  });

  it('displays consultation type indicators', () => {
    const mixedConsultationSlots = [
      ...mockTimeSlots,
      {
        time: '15:00',
        available: true,
        location_id: '1',
        location_name: 'Clínica Central',
        duration_minutes: 30,
        tipo_consulta: 'telemedicina' as const,
        medico_id: 'med1'
      }
    ];

    render(
      <LocationTimeSlotMapping
        timeSlots={mixedConsultationSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        showConsultationType={true}
      />
    );

    expect(screen.getByText('Presencial')).toBeInTheDocument();
    expect(screen.getByText('Telemedicina')).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
      />
    );

    const timeSlotButtons = screen.getAllByRole('button');
    timeSlotButtons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <LocationTimeSlotMapping
        timeSlots={mockTimeSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
      />
    );

    const timeSlotButtons = screen.getAllByRole('button');
    timeSlotButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('shows conflict indicators for overlapping slots', () => {
    const conflictingSlots = [
      {
        time: '09:00',
        available: true,
        location_id: '1',
        location_name: 'Clínica Central',
        duration_minutes: 60, // Longer duration
        tipo_consulta: 'presencial' as const,
        medico_id: 'med1'
      },
      {
        time: '09:30',
        available: true,
        location_id: '1',
        location_name: 'Clínica Central',
        duration_minutes: 30,
        tipo_consulta: 'presencial' as const,
        medico_id: 'med1'
      }
    ];

    render(
      <LocationTimeSlotMapping
        timeSlots={conflictingSlots}
        locations={mockLocations}
        onTimeSlotSelect={mockOnTimeSlotSelect}
        showConflicts={true}
      />
    );

    expect(screen.getByText('Conflito de horário')).toBeInTheDocument();
  });
});