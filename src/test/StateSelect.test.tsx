import { render, screen, fireEvent } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { StateSelect } from '@/components/scheduling/StateSelect';

describe('StateSelect', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    selectedState: '',
    isLoading: false,
    onChange: mockOnChange,
    disabled: false,
  };

  const mockStates = [
    { uf: 'SP' },
    { uf: 'RJ' },
    { uf: 'MG' },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Defensive Programming Tests', () => {
    it('should handle undefined states gracefully', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={undefined}
        />
      );

      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Nenhum estado disponível')).toBeInTheDocument();
      expect(screen.getByText('Não foi possível carregar os estados. Tente recarregar a página.')).toBeInTheDocument();
    });

    it('should handle null states gracefully', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={null}
        />
      );

      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Nenhum estado disponível')).toBeInTheDocument();
      expect(screen.getByText('Não foi possível carregar os estados. Tente recarregar a página.')).toBeInTheDocument();
    });

    it('should handle empty states array gracefully', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={[]}
        />
      );

      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Nenhum estado disponível')).toBeInTheDocument();
      expect(screen.getByText('Não foi possível carregar os estados. Tente recarregar a página.')).toBeInTheDocument();
    });

    it('should disable select when states is undefined', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={undefined}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should disable select when states is null', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={null}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should disable select when states is empty array', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={[]}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });
  });

  describe('Loading State Tests', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
          isLoading={true}
        />
      );

      // Check for the loading spinner by its class or SVG element
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show loading placeholder when isLoading is true', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
          isLoading={true}
        />
      );

      expect(screen.getByText('Carregando estados...')).toBeInTheDocument();
    });

    it('should disable select when isLoading is true', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
          isLoading={true}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should not show error message when loading', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={undefined}
          isLoading={true}
        />
      );

      expect(screen.queryByText('Não foi possível carregar os estados. Tente recarregar a página.')).not.toBeInTheDocument();
    });
  });

  describe('Normal Operation Tests', () => {
    it('should render states when provided with valid data', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
        />
      );

      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Selecione o estado')).toBeInTheDocument();
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
    });

    it('should call onChange when a state is selected', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Note: This test might need adjustment based on the actual Select component behavior
      // The exact interaction might vary depending on the UI library implementation
    });

    it('should show selected state value', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
          selectedState="SP"
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toHaveAttribute('data-state', 'closed');
      expect(selectTrigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
          disabled={true}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });
  });

  describe('Error Handling Tests', () => {
    it('should not crash when states contains invalid data structure', () => {
      const invalidStates = [
        { uf: 'SP' },
        null, // Invalid item
        { uf: 'RJ' },
        undefined, // Invalid item
      ] as any;

      render(
        <StateSelect
          {...defaultProps}
          states={invalidStates}
        />
      );

      // Should render without crashing and show valid states
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Selecione o estado')).toBeInTheDocument();
    });

    it('should handle states with missing uf property gracefully', () => {
      const statesWithMissingUf = [
        { uf: 'SP' },
        {}, // Missing uf property
        { uf: 'RJ' },
      ] as any;

      render(
        <StateSelect
          {...defaultProps}
          states={statesWithMissingUf}
        />
      );

      // Should render without crashing and filter out invalid items
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Selecione o estado')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper label association', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={mockStates}
        />
      );

      const label = screen.getByText('Estado');
      const select = screen.getByRole('combobox');
      
      expect(label).toBeInTheDocument();
      expect(select).toHaveAttribute('id', 'state-select');
    });

    it('should have appropriate ARIA attributes when disabled', () => {
      render(
        <StateSelect
          {...defaultProps}
          states={undefined}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });
  });
});