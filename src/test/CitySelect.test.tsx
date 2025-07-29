import { render, screen, fireEvent } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { CitySelect } from '@/components/scheduling/CitySelect';

// Mock data
const mockCities = [
  { cidade: 'São Paulo' },
  { cidade: 'Rio de Janeiro' },
  { cidade: 'Belo Horizonte' }
];

describe('CitySelect', () => {
  const defaultProps = {
    selectedCity: '',
    isLoading: false,
    onChange: vi.fn(),
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Defensive Programming Tests', () => {
    it('should handle undefined cities gracefully', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={undefined}
        />
      );

      expect(screen.getByText('Cidade')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma cidade disponível')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma cidade disponível para o estado selecionado')).toBeInTheDocument();
      
      // Select should be disabled when cities is undefined
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should handle null cities gracefully', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={null}
        />
      );

      expect(screen.getByText('Cidade')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma cidade disponível')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma cidade disponível para o estado selecionado')).toBeInTheDocument();
      
      // Select should be disabled when cities is null
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should handle empty cities array gracefully', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={[]}
        />
      );

      expect(screen.getByText('Cidade')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma cidade disponível')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma cidade disponível para o estado selecionado')).toBeInTheDocument();
      
      // Select should be disabled when cities array is empty
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should not show error message when loading', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={undefined}
          isLoading={true}
        />
      );

      expect(screen.getByText('Cidade')).toBeInTheDocument();
      expect(screen.getByText('Carregando cidades...')).toBeInTheDocument();
      expect(screen.queryByText('Nenhuma cidade disponível para o estado selecionado')).not.toBeInTheDocument();
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Normal Operation Tests', () => {
    it('should render cities when valid array is provided', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
        />
      );

      expect(screen.getByText('Cidade')).toBeInTheDocument();
      expect(screen.getByText('Selecione a cidade')).toBeInTheDocument();
      
      // Select should be enabled when cities are available
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
      
      // Should not show error message
      expect(screen.queryByText('Nenhuma cidade disponível para o estado selecionado')).not.toBeInTheDocument();
    });

    it('should call onChange when city is selected', () => {
      const mockOnChange = vi.fn();
      
      render(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
          onChange={mockOnChange}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      // Click on first city option
      const cityOption = screen.getByText('São Paulo');
      fireEvent.click(cityOption);
      
      expect(mockOnChange).toHaveBeenCalledWith('São Paulo');
    });

    it('should display selected city value', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
          selectedCity="Rio de Janeiro"
        />
      );

      expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
          disabled={true}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
          isLoading={true}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle cities with special characters', () => {
      const specialCities = [
        { cidade: 'São José dos Campos' },
        { cidade: 'Ribeirão Preto' },
        { cidade: 'Poços de Caldas' }
      ];

      render(
        <CitySelect
          {...defaultProps}
          cities={specialCities}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      expect(screen.getByText('São José dos Campos')).toBeInTheDocument();
      expect(screen.getByText('Ribeirão Preto')).toBeInTheDocument();
      expect(screen.getByText('Poços de Caldas')).toBeInTheDocument();
    });

    it('should handle single city in array', () => {
      const singleCity = [{ cidade: 'São Paulo' }];

      render(
        <CitySelect
          {...defaultProps}
          cities={singleCity}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
      
      fireEvent.click(selectTrigger);
      expect(screen.getByText('São Paulo')).toBeInTheDocument();
    });

    it('should handle rapid state changes from undefined to populated', () => {
      const { rerender } = render(
        <CitySelect
          {...defaultProps}
          cities={undefined}
        />
      );

      // Initially should show no cities available
      expect(screen.getByText('Nenhuma cidade disponível')).toBeInTheDocument();
      
      // Update with cities
      rerender(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
        />
      );

      // Should now show normal placeholder
      expect(screen.getByText('Selecione a cidade')).toBeInTheDocument();
      expect(screen.queryByText('Nenhuma cidade disponível para o estado selecionado')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ids', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
        />
      );

      const label = screen.getByText('Cidade');
      const select = screen.getByRole('combobox');
      
      expect(label).toBeInTheDocument();
      expect(select).toHaveAttribute('id', 'city-select');
    });

    it('should be keyboard accessible', () => {
      render(
        <CitySelect
          {...defaultProps}
          cities={mockCities}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      
      // Should be focusable
      selectTrigger.focus();
      expect(selectTrigger).toHaveFocus();
      
      // Should open on Enter key
      fireEvent.keyDown(selectTrigger, { key: 'Enter' });
      expect(screen.getByText('São Paulo')).toBeInTheDocument();
    });
  });
});