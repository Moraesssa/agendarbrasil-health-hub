import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { LocationCard } from '@/components/location/LocationCard';
import { LocationDetailsPanel } from '@/components/location/LocationDetailsPanel';
import { LocationComparison } from '@/components/location/LocationComparison';
import { LocationActions } from '@/components/location/LocationActions';
import { LocationFacilities } from '@/components/location/LocationFacilities';
import { LocationWithTimeSlots } from '@/types/location';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

const mockLocation: LocationWithTimeSlots = {
  id: '1',
  nome_local: 'Clínica Teste',
  endereco_completo: 'Rua Teste, 123, Centro, São Paulo, SP',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
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
  is_open_now: true
};

const mockLocations = [mockLocation, { ...mockLocation, id: '2', nome_local: 'Hospital Norte' }];

describe('Location Components Accessibility', () => {
  describe('LocationCard Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<LocationCard location={mockLocation} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels and roles', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Estabelecimento'));
      expect(card).toHaveAttribute('aria-describedby');
    });

    it('supports keyboard navigation', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('has proper heading hierarchy', () => {
      render(<LocationCard location={mockLocation} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Clínica Teste');
    });

    it('provides alternative text for status indicators', () => {
      render(<LocationCard location={mockLocation} />);
      
      const statusBadge = screen.getByText('Aberto');
      expect(statusBadge).toHaveAttribute('aria-label', 'Status: Aberto');
    });

    it('announces selection state changes', () => {
      const { rerender } = render(<LocationCard location={mockLocation} isSelected={false} />);
      
      rerender(<LocationCard location={mockLocation} isSelected={true} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('LocationDetailsPanel Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper landmark roles', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('provides live region for dynamic updates', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('has accessible search input', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar estabelecimentos');
      expect(searchInput).toHaveAttribute('aria-describedby');
    });

    it('provides clear filter descriptions', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const filterButton = screen.getByText('Apenas Abertos');
      expect(filterButton).toHaveAttribute('aria-describedby');
    });

    it('announces results count changes', () => {
      const { rerender } = render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      rerender(
        <LocationDetailsPanel
          locations={[mockLocation]}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const resultsAnnouncement = screen.getByRole('status');
      expect(resultsAnnouncement).toHaveTextContent('1 estabelecimento encontrado');
    });
  });

  describe('LocationComparison Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<LocationComparison locations={mockLocations} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper table structure', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Comparação de estabelecimentos');
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
      
      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders.length).toBeGreaterThan(0);
    });

    it('provides table caption', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      const caption = screen.getByText(/Comparação detalhada/);
      expect(caption).toBeInTheDocument();
    });

    it('has accessible column headers', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('provides row headers for comparison criteria', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      const rowHeaders = screen.getAllByRole('rowheader');
      rowHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'row');
      });
    });

    it('announces comparison changes', () => {
      const { rerender } = render(
        <LocationComparison locations={mockLocations} selectedLocationId="1" />
      );
      
      rerender(
        <LocationComparison locations={mockLocations} selectedLocationId="2" />
      );
      
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/selecionado/i);
    });
  });

  describe('LocationActions Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<LocationActions location={mockLocation} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has descriptive button labels', () => {
      render(<LocationActions location={mockLocation} />);
      
      const mapButton = screen.getByLabelText('Abrir localização no mapa');
      const callButton = screen.getByLabelText('Ligar para estabelecimento');
      const shareButton = screen.getByLabelText('Compartilhar localização');
      
      expect(mapButton).toBeInTheDocument();
      expect(callButton).toBeInTheDocument();
      expect(shareButton).toBeInTheDocument();
    });

    it('provides keyboard shortcuts', () => {
      render(<LocationActions location={mockLocation} />);
      
      const mapButton = screen.getByLabelText('Abrir localização no mapa');
      expect(mapButton).toHaveAttribute('accessKey', 'm');
    });

    it('shows loading states accessibly', () => {
      render(<LocationActions location={mockLocation} />);
      
      // Simulate loading state
      const mapButton = screen.getByLabelText('Abrir localização no mapa');
      expect(mapButton).toHaveAttribute('aria-busy', 'false');
    });

    it('disables buttons appropriately with explanations', () => {
      const locationWithoutPhone = { ...mockLocation, telefone: undefined };
      render(<LocationActions location={locationWithoutPhone} />);
      
      const callButton = screen.getByLabelText(/Ligar/);
      expect(callButton).toBeDisabled();
      expect(callButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('LocationFacilities Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<LocationFacilities facilities={mockLocation.facilidades} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper list structure', () => {
      render(<LocationFacilities facilities={mockLocation.facilidades} />);
      
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Facilidades disponíveis');
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(mockLocation.facilidades.length);
    });

    it('provides descriptive labels for facilities', () => {
      render(<LocationFacilities facilities={mockLocation.facilidades} />);
      
      const parkingFacility = screen.getByLabelText(/Estacionamento.*gratuito/);
      expect(parkingFacility).toBeInTheDocument();
    });

    it('uses appropriate ARIA attributes for tooltips', () => {
      render(<LocationFacilities facilities={mockLocation.facilidades} />);
      
      const facilityWithTooltip = screen.getByText('Estacionamento');
      expect(facilityWithTooltip).toHaveAttribute('aria-describedby');
    });

    it('distinguishes available and unavailable facilities', () => {
      const facilitiesWithUnavailable = [
        ...mockLocation.facilidades,
        { type: 'farmacia' as const, available: false }
      ];
      
      render(<LocationFacilities facilities={facilitiesWithUnavailable} showUnavailable={true} />);
      
      const availableFacility = screen.getByText('Estacionamento');
      const unavailableFacility = screen.getByText('Farmácia');
      
      expect(availableFacility).toHaveAttribute('aria-label', expect.stringContaining('disponível'));
      expect(unavailableFacility).toHaveAttribute('aria-label', expect.stringContaining('indisponível'));
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through location cards', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex', '0');
      });
    });

    it('provides skip links for complex layouts', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const skipLink = screen.getByText('Pular para resultados');
      expect(skipLink).toHaveAttribute('href', '#location-results');
    });

    it('manages focus appropriately during interactions', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      card.focus();
      expect(document.activeElement).toBe(card);
    });
  });

  describe('Screen Reader Support', () => {
    it('provides meaningful announcements for state changes', () => {
      const { rerender } = render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      rerender(
        <LocationDetailsPanel
          locations={[mockLocation]}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
          isLoading={true}
        />
      );
      
      const loadingAnnouncement = screen.getByRole('status');
      expect(loadingAnnouncement).toHaveTextContent('Carregando estabelecimentos');
    });

    it('provides context for complex information', () => {
      render(<LocationCard location={mockLocation} />);
      
      const operatingHours = screen.getByText(/08:00.*18:00/);
      expect(operatingHours).toHaveAttribute('aria-label', 'Horário de funcionamento: 08:00 às 18:00');
    });

    it('uses appropriate heading levels', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Estabelecimentos Disponíveis');
      
      const locationHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(locationHeadings.length).toBe(mockLocations.length);
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('maintains accessibility in high contrast mode', () => {
      // Simulate high contrast mode
      document.body.classList.add('high-contrast');
      
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      const computedStyle = window.getComputedStyle(card);
      
      // Should have sufficient contrast
      expect(computedStyle.borderWidth).not.toBe('0px');
      
      document.body.classList.remove('high-contrast');
    });

    it('provides visual focus indicators', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      card.focus();
      
      const computedStyle = window.getComputedStyle(card);
      expect(computedStyle.outline).not.toBe('none');
    });

    it('uses semantic colors with text alternatives', () => {
      render(<LocationCard location={mockLocation} />);
      
      const statusBadge = screen.getByText('Aberto');
      expect(statusBadge).toHaveAttribute('aria-label', expect.stringContaining('Aberto'));
    });
  });

  describe('Mobile Accessibility', () => {
    it('has appropriate touch targets', () => {
      render(<LocationActions location={mockLocation} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const minHeight = parseInt(computedStyle.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44); // iOS/Android minimum
      });
    });

    it('provides haptic feedback indicators', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('data-haptic', 'light');
    });

    it('supports voice control', () => {
      render(<LocationActions location={mockLocation} />);
      
      const mapButton = screen.getByLabelText('Abrir localização no mapa');
      expect(mapButton).toHaveAttribute('data-voice-command', 'abrir mapa');
    });
  });

  describe('Internationalization and Localization', () => {
    it('provides proper language attributes', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('lang', 'pt-BR');
    });

    it('formats content appropriately for locale', () => {
      render(<LocationCard location={mockLocation} />);
      
      const phoneNumber = screen.getByText('(11) 1234-5678');
      expect(phoneNumber).toHaveAttribute('aria-label', 'Telefone: (11) 1234-5678');
    });

    it('provides RTL support when needed', () => {
      document.dir = 'rtl';
      
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('rtl-support');
      
      document.dir = 'ltr';
    });
  });
});