import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LocationActions } from '@/components/location/LocationActions';
import { communicationService } from '@/services/communicationService';
import { EnhancedLocation } from '@/types/location';

// Mock the communication service
vi.mock('@/services/communicationService', () => ({
  communicationService: {
    makePhoneCall: vi.fn(),
    sendWhatsApp: vi.fn(),
    sendSMS: vi.fn(),
    sendEmail: vi.fn(),
    shareViaSystem: vi.fn(),
    isPhoneCallSupported: vi.fn(),
    isWhatsAppAvailable: vi.fn(),
    copyToClipboard: vi.fn()
  }
}));

// Mock Web Share API
const mockWebShare = {
  share: vi.fn(),
  canShare: vi.fn()
};

Object.defineProperty(navigator, 'share', {
  value: mockWebShare.share,
  writable: true
});

Object.defineProperty(navigator, 'canShare', {
  value: mockWebShare.canShare,
  writable: true
});

// Mock Clipboard API
const mockClipboard = {
  writeText: vi.fn()
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
});

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
  website: 'https://clinicateste.com',
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
    { type: 'acessibilidade', available: true }
  ],
  status: 'ativo',
  horarios_disponiveis: [],
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual'
};

describe('Location Communication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful communication service availability
    vi.mocked(communicationService.isPhoneCallSupported).mockReturnValue(true);
    vi.mocked(communicationService.isWhatsAppAvailable).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Phone Call Integration', () => {
    it('initiates phone call on mobile devices', async () => {
      vi.mocked(communicationService.makePhoneCall).mockResolvedValue(true);

      render(<LocationActions location={mockLocation} />);

      const callButton = screen.getByText('Ligar');
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(communicationService.makePhoneCall).toHaveBeenCalledWith(
          mockLocation.telefone
        );
      });
    });

    it('shows fallback options when phone calls not supported', async () => {
      vi.mocked(communicationService.isPhoneCallSupported).mockReturnValue(false);

      render(<LocationActions location={mockLocation} />);

      const callButton = screen.getByText('Ligar');
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(screen.getByText('Copiar Telefone')).toBeInTheDocument();
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      });
    });

    it('handles phone call failures gracefully', async () => {
      vi.mocked(communicationService.makePhoneCall).mockRejectedValue(
        new Error('Phone app not available')
      );

      render(<LocationActions location={mockLocation} />);

      const callButton = screen.getByText('Ligar');
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(screen.getByText('Erro ao iniciar chamada')).toBeInTheDocument();
        expect(screen.getByText('Tentar WhatsApp')).toBeInTheDocument();
      });
    });

    it('formats phone numbers correctly for different regions', async () => {
      const locationWithInternationalPhone = {
        ...mockLocation,
        telefone: '+55 11 1234-5678'
      };

      render(<LocationActions location={locationWithInternationalPhone} />);

      const callButton = screen.getByText('Ligar');
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(communicationService.makePhoneCall).toHaveBeenCalledWith(
          '+55 11 1234-5678'
        );
      });
    });
  });

  describe('WhatsApp Integration', () => {
    it('sends WhatsApp message with location details', async () => {
      vi.mocked(communicationService.sendWhatsApp).mockResolvedValue(true);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const whatsappButton = await screen.findByText('WhatsApp');
      fireEvent.click(whatsappButton);

      await waitFor(() => {
        expect(communicationService.sendWhatsApp).toHaveBeenCalledWith(
          mockLocation.whatsapp,
          expect.stringContaining(mockLocation.nome_local)
        );
      });

      const expectedMessage = expect.stringContaining('Clínica Teste');
      expect(communicationService.sendWhatsApp).toHaveBeenCalledWith(
        mockLocation.whatsapp,
        expectedMessage
      );
    });

    it('includes appointment details in WhatsApp message', async () => {
      const appointmentDetails = {
        date: '2024-02-15',
        time: '09:00',
        doctor: 'Dr. João Silva'
      };

      render(
        <LocationActions 
          location={mockLocation} 
          appointmentDetails={appointmentDetails}
        />
      );

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const whatsappButton = await screen.findByText('WhatsApp');
      fireEvent.click(whatsappButton);

      await waitFor(() => {
        const expectedMessage = expect.stringMatching(
          /Consulta marcada.*15\/02\/2024.*09:00.*Dr\. João Silva/
        );
        expect(communicationService.sendWhatsApp).toHaveBeenCalledWith(
          mockLocation.whatsapp,
          expectedMessage
        );
      });
    });

    it('handles WhatsApp unavailable gracefully', async () => {
      vi.mocked(communicationService.isWhatsAppAvailable).mockReturnValue(false);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
        expect(screen.getByText('SMS')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
      });
    });

    it('falls back to SMS when WhatsApp fails', async () => {
      vi.mocked(communicationService.sendWhatsApp).mockRejectedValue(
        new Error('WhatsApp not installed')
      );
      vi.mocked(communicationService.sendSMS).mockResolvedValue(true);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const whatsappButton = await screen.findByText('WhatsApp');
      fireEvent.click(whatsappButton);

      await waitFor(() => {
        expect(screen.getByText('WhatsApp indisponível')).toBeInTheDocument();
        expect(screen.getByText('Enviar SMS')).toBeInTheDocument();
      });

      const smsButton = screen.getByText('Enviar SMS');
      fireEvent.click(smsButton);

      expect(communicationService.sendSMS).toHaveBeenCalled();
    });
  });

  describe('SMS Integration', () => {
    it('sends SMS with location information', async () => {
      vi.mocked(communicationService.sendSMS).mockResolvedValue(true);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const smsButton = await screen.findByText('SMS');
      fireEvent.click(smsButton);

      await waitFor(() => {
        expect(communicationService.sendSMS).toHaveBeenCalledWith(
          mockLocation.telefone,
          expect.stringContaining(mockLocation.nome_local)
        );
      });
    });

    it('truncates SMS message to character limit', async () => {
      const longLocation = {
        ...mockLocation,
        nome_local: 'Centro Médico Especializado em Cardiologia e Neurologia Avançada',
        endereco_completo: 'Rua Muito Longa com Nome Extenso para Testar Truncamento, 12345, Bairro com Nome Muito Grande, Cidade Grande, Estado'
      };

      render(<LocationActions location={longLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const smsButton = await screen.findByText('SMS');
      fireEvent.click(smsButton);

      await waitFor(() => {
        const [, message] = vi.mocked(communicationService.sendSMS).mock.calls[0];
        expect(message.length).toBeLessThanOrEqual(160); // SMS character limit
      });
    });

    it('handles SMS service unavailable', async () => {
      vi.mocked(communicationService.sendSMS).mockRejectedValue(
        new Error('SMS service not available')
      );

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const smsButton = await screen.findByText('SMS');
      fireEvent.click(smsButton);

      await waitFor(() => {
        expect(screen.getByText('SMS indisponível')).toBeInTheDocument();
        expect(screen.getByText('Copiar Informações')).toBeInTheDocument();
      });
    });
  });

  describe('Email Integration', () => {
    it('sends email with detailed location information', async () => {
      vi.mocked(communicationService.sendEmail).mockResolvedValue(true);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const emailButton = await screen.findByText('Email');
      fireEvent.click(emailButton);

      await waitFor(() => {
        expect(communicationService.sendEmail).toHaveBeenCalledWith(
          mockLocation.email,
          expect.stringContaining('Informações'),
          expect.stringContaining(mockLocation.endereco_completo)
        );
      });
    });

    it('includes facility information in email', async () => {
      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const emailButton = await screen.findByText('Email');
      fireEvent.click(emailButton);

      await waitFor(() => {
        const [, , body] = vi.mocked(communicationService.sendEmail).mock.calls[0];
        expect(body).toContain('Facilidades');
        expect(body).toContain('Estacionamento');
        expect(body).toContain('Acessibilidade');
      });
    });

    it('formats email content as HTML', async () => {
      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const emailButton = await screen.findByText('Email');
      fireEvent.click(emailButton);

      await waitFor(() => {
        const [, , body] = vi.mocked(communicationService.sendEmail).mock.calls[0];
        expect(body).toContain('<h2>');
        expect(body).toContain('<p>');
        expect(body).toContain('<ul>');
      });
    });
  });

  describe('System Share Integration', () => {
    it('uses Web Share API when available', async () => {
      mockWebShare.canShare.mockReturnValue(true);
      mockWebShare.share.mockResolvedValue(undefined);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const systemShareButton = await screen.findByText('Compartilhar');
      fireEvent.click(systemShareButton);

      await waitFor(() => {
        expect(mockWebShare.share).toHaveBeenCalledWith({
          title: mockLocation.nome_local,
          text: expect.stringContaining(mockLocation.endereco_completo),
          url: expect.any(String)
        });
      });
    });

    it('falls back to clipboard when Web Share API unavailable', async () => {
      mockWebShare.canShare.mockReturnValue(false);
      mockClipboard.writeText.mockResolvedValue(undefined);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const systemShareButton = await screen.findByText('Copiar Link');
      fireEvent.click(systemShareButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining(mockLocation.nome_local)
        );
      });
    });

    it('shows success feedback after sharing', async () => {
      mockWebShare.share.mockResolvedValue(undefined);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const systemShareButton = await screen.findByText('Compartilhar');
      fireEvent.click(systemShareButton);

      await waitFor(() => {
        expect(screen.getByText('Compartilhado com sucesso!')).toBeInTheDocument();
      });
    });
  });

  describe('Clipboard Integration', () => {
    it('copies location information to clipboard', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const clipboardButton = await screen.findByText('Copiar');
      fireEvent.click(clipboardButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining(mockLocation.nome_local)
        );
      });
    });

    it('handles clipboard API unavailable', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText('Selecionar Texto')).toBeInTheDocument();
      });
    });

    it('provides manual copy fallback', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard access denied'));

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const clipboardButton = await screen.findByText('Copiar');
      fireEvent.click(clipboardButton);

      await waitFor(() => {
        expect(screen.getByText('Selecione e copie o texto abaixo:')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue(
          expect.stringContaining(mockLocation.nome_local)
        );
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('provides multiple fallback options when primary methods fail', async () => {
      vi.mocked(communicationService.sendWhatsApp).mockRejectedValue(new Error('Failed'));
      vi.mocked(communicationService.sendSMS).mockRejectedValue(new Error('Failed'));
      vi.mocked(communicationService.sendEmail).mockRejectedValue(new Error('Failed'));

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const whatsappButton = await screen.findByText('WhatsApp');
      fireEvent.click(whatsappButton);

      await waitFor(() => {
        expect(screen.getByText('Métodos alternativos:')).toBeInTheDocument();
        expect(screen.getByText('Copiar Informações')).toBeInTheDocument();
        expect(screen.getByText('Salvar Contato')).toBeInTheDocument();
      });
    });

    it('shows appropriate error messages for different failure types', async () => {
      vi.mocked(communicationService.makePhoneCall).mockRejectedValue(
        new Error('PERMISSION_DENIED')
      );

      render(<LocationActions location={mockLocation} />);

      const callButton = screen.getByText('Ligar');
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(screen.getByText('Permissão negada para fazer chamadas')).toBeInTheDocument();
      });
    });

    it('handles network connectivity issues', async () => {
      vi.mocked(communicationService.sendWhatsApp).mockRejectedValue(
        new Error('Network error')
      );

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const whatsappButton = await screen.findByText('WhatsApp');
      fireEvent.click(whatsappButton);

      await waitFor(() => {
        expect(screen.getByText('Verifique sua conexão')).toBeInTheDocument();
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('provides clear feedback for successful actions', async () => {
      vi.mocked(communicationService.makePhoneCall).mockResolvedValue(true);

      render(<LocationActions location={mockLocation} />);

      const callButton = screen.getByText('Ligar');
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(screen.getByText('Chamada iniciada')).toBeInTheDocument();
      });
    });

    it('shows loading states during communication actions', async () => {
      vi.mocked(communicationService.sendWhatsApp).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const whatsappButton = await screen.findByText('WhatsApp');
      fireEvent.click(whatsappButton);

      expect(screen.getByText('Enviando...')).toBeInTheDocument();
    });

    it('supports keyboard navigation for communication options', async () => {
      render(<LocationActions location={mockLocation} />);

      const shareButton = screen.getByText('Compartilhar');
      fireEvent.click(shareButton);

      const communicationOptions = await screen.findAllByRole('button');
      communicationOptions.forEach(option => {
        expect(option).toHaveAttribute('tabIndex', '0');
      });
    });
  });
});