import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationCard } from '@/components/location/LocationCard';
import { LocationWithTimeSlots } from '@/types/location';

// Mock location data for testing
const mockLocation: LocationWithTimeSlots = {
  id: '1',
  nome_local: 'Clínica Teste',
  endereco_completo: 'Rua Teste, 123',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  email: 'contato@clinicateste.com',
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
    {
      time: '09:00',
      available: true,
      location_id: '1',
      location_name: 'Clínica Teste',
      duration_minutes: 30,
      tipo_consulta: 'presencial',
      medico_id: 'med1'
    }
  ],
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual',
  available_slots_count: 5,
  is_open_now: true
};

describe('LocationCard', () => {
  it('renders location name and basic information', () => {
    render(<LocationCard location={mockLocation} />);
    
    expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    expect(screen.getByText(/Rua Teste, 123/)).toBeInTheDocument();
    expect(screen.getByText('(11) 1234-5678')).toBeInTheDocument();
  });

  it('displays status badge correctly', () => {
    render(<LocationCard location={mockLocation} />);
    
    // The status should show "Fechado" because the mock location is set to closed on Sunday
    expect(screen.getByText('Fechado')).toBeInTheDocument();
  });

  it('shows available time slots count', () => {
    render(<LocationCard location={mockLocation} />);
    
    expect(screen.getByText('5 horários')).toBeInTheDocument();
  });

  it('displays facilities', () => {
    render(<LocationCard location={mockLocation} />);
    
    expect(screen.getByText('Facilidades')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(<LocationCard location={mockLocation} onSelect={onSelect} />);
    
    const card = screen.getByLabelText('Estabelecimento Clínica Teste, 5 horários disponíveis');
    fireEvent.click(card);
    
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders action buttons', () => {
    render(<LocationCard location={mockLocation} />);
    
    expect(screen.getByText('Ver no Mapa')).toBeInTheDocument();
    expect(screen.getByText('Ligar')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar')).toBeInTheDocument();
  });

  it('applies selected styling when isSelected is true', () => {
    render(<LocationCard location={mockLocation} isSelected={true} />);
    
    const card = screen.getByLabelText('Estabelecimento Clínica Teste, 5 horários disponíveis');
    expect(card).toHaveClass('border-blue-500');
  });

  it('renders in compact mode', () => {
    render(<LocationCard location={mockLocation} compact={true} />);
    
    expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Compact time slots display
  });

  it('handles closed location status', () => {
    const closedLocation = {
      ...mockLocation,
      status: 'temporariamente_fechado' as const,
      motivo_fechamento: 'Reforma em andamento',
      previsao_reabertura: '2024-02-01'
    };

    render(<LocationCard location={closedLocation} />);
    
    expect(screen.getByText('Temporariamente Fechado')).toBeInTheDocument();
    expect(screen.getByText('Reforma em andamento')).toBeInTheDocument();
  });
});