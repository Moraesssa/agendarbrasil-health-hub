import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationActions } from '@/components/location/LocationActions';
import { EnhancedLocation } from '@/types/location';

// Mock external services
vi.mock('@/services/mapsService', () => ({
  openLocationInMaps: vi.fn(),
  getDirections: vi.fn(),
}));

vi.mock('@/services/communicationService', () => ({
  makePhoneCall: vi.fn(),
  sendWhatsApp: vi.fn(),
  shareLocation: vi.fn(),
}));

const mockLocation: EnhancedLocation = {
  id: '1',
  nome_local: 'Clínica Teste',
  endereco_completo: 'Rua Teste, 123, Centro, São Paulo, SP',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  whatsapp: '(11) 91234-5678',
  email: 'contato@clinicateste.com',
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
  facilidades: [],
  status: 'ativo',
  horarios_disponiveis: [],
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual'
};

describe('LocationActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all action buttons', () => {
    render(<LocationActions location={mockLocation} />);
    
    expect(screen.getByText('Ver no Mapa')).toBeInTheDocument();
    expect(screen.getByText('Ligar')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar')).toBeInTheDocument();
  });

  it('opens maps when "Ver no Mapa" is clicked', async () => {
    const { openLocationInMaps } = await import('@/services/mapsService');
    render(<LocationActions location={mockLocation} />);
    
    const mapButton = screen.getByText('Ver no Mapa');
    fireEvent.click(mapButton);
    
    await waitFor(() => {
      expect(openLocationInMaps).toHaveBeenCalledWith(mockLocation.coordenadas);
    });
  });

  it('initiates phone call when "Ligar" is clicked', async () => {
    const { makePhoneCall } = await import('@/services/communicationService');
    render(<LocationActions location={mockLocation} />);
    
    const callButton = screen.getByText('Ligar');
    fireEvent.click(callButton);
    
    await waitFor(() => {
      expect(makePhoneCall).toHaveBeenCalledWith(mockLocation.telefone);
    });
  });

  it('opens share options when "Compartilhar" is clicked', async () => {
    render(<LocationActions location={mockLocation} />);
    
    const shareButton = screen.getByText('Compartilhar');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });
  });

  it('handles WhatsApp sharing', async () => {
    const { sendWhatsApp } = await import('@/services/communicationService');
    render(<LocationActions location={mockLocation} />);
    
    const shareButton = screen.getByText('Compartilhar');
    fireEvent.click(shareButton);
    
    const whatsappButton = await screen.findByText('WhatsApp');
    fireEvent.click(whatsappButton);
    
    await waitFor(() => {
      expect(sendWhatsApp).toHaveBeenCalledWith(
        mockLocation.whatsapp,
        expect.stringContaining(mockLocation.nome_local)
      );
    });
  });

  it('disables map button when no coordinates available', () => {
    const locationWithoutCoords = { ...mockLocation, coordenadas: undefined };
    render(<LocationActions location={locationWithoutCoords} />);
    
    const mapButton = screen.getByText('Ver no Mapa');
    expect(mapButton).toBeDisabled();
  });

  it('disables call button when no phone number available', () => {
    const locationWithoutPhone = { ...mockLocation, telefone: undefined };
    render(<LocationActions location={locationWithoutPhone} />);
    
    const callButton = screen.getByText('Ligar');
    expect(callButton).toBeDisabled();
  });

  it('shows loading states during actions', async () => {
    const { openLocationInMaps } = await import('@/services/mapsService');
    openLocationInMaps.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<LocationActions location={mockLocation} />);
    
    const mapButton = screen.getByText('Ver no Mapa');
    fireEvent.click(mapButton);
    
    expect(screen.getByText('Abrindo...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Ver no Mapa')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    const { openLocationInMaps } = await import('@/services/mapsService');
    openLocationInMaps.mockRejectedValue(new Error('Maps service unavailable'));
    
    render(<LocationActions location={mockLocation} />);
    
    const mapButton = screen.getByText('Ver no Mapa');
    fireEvent.click(mapButton);
    
    await waitFor(() => {
      expect(screen.getByText('Erro ao abrir mapa')).toBeInTheDocument();
    });
  });

  it('renders in compact mode', () => {
    render(<LocationActions location={mockLocation} compact={true} />);
    
    // In compact mode, buttons should be icon-only
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    
    // Should not show text labels in compact mode
    expect(screen.queryByText('Ver no Mapa')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LocationActions location={mockLocation} />);
    
    const mapButton = screen.getByLabelText('Abrir localização no mapa');
    const callButton = screen.getByLabelText('Ligar para estabelecimento');
    const shareButton = screen.getByLabelText('Compartilhar localização');
    
    expect(mapButton).toBeInTheDocument();
    expect(callButton).toBeInTheDocument();
    expect(shareButton).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(<LocationActions location={mockLocation} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });
});