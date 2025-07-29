import { render, screen, fireEvent } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { SpecialtySelect } from '@/components/scheduling/SpecialtySelect';

// Mock data for testing
const mockSpecialties = [
  'Cardiologia',
  'Dermatologia',
  'Neurologia',
  'Pediatria'
];

const defaultProps = {
  selectedSpecialty: '',
  isLoading: false,
  onChange: vi.fn(),
  disabled: false
};

describe('SpecialtySelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Defensive Programming Tests', () => {
    it('should handle undefined specialties gracefully', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={undefined}
        />
      );

      expect(screen.getByText('Selecione a Especialidade')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma especialidade')).toBeInTheDocument();
      expect(screen.getByText('Escolha a área médica')).toBeInTheDocument();
      
      // Select should be enabled but show empty message when clicked
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
      
      // Open dropdown to see the empty message
      fireEvent.click(selectTrigger);
      expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
      expect(screen.getByText('Tente novamente mais tarde')).toBeInTheDocument();
    });

    it('should handle null specialties gracefully', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={null}
        />
      );

      expect(screen.getByText('Selecione a Especialidade')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma especialidade')).toBeInTheDocument();
      expect(screen.getByText('Escolha a área médica')).toBeInTheDocument();
      
      // Select should be enabled but show empty message when clicked
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
      
      // Open dropdown to see the empty message
      fireEvent.click(selectTrigger);
      expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
      expect(screen.getByText('Tente novamente mais tarde')).toBeInTheDocument();
    });

    it('should handle empty specialties array gracefully', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={[]}
        />
      );

      expect(screen.getByText('Selecione a Especialidade')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma especialidade')).toBeInTheDocument();
      expect(screen.getByText('Escolha a área médica')).toBeInTheDocument();
      
      // Select should be enabled but show empty message when clicked
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
      
      // Open dropdown to see the empty message
      fireEvent.click(selectTrigger);
      expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
      expect(screen.getByText('Tente novamente mais tarde')).toBeInTheDocument();
    });

    it('should not show error message when loading', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={undefined}
          isLoading={true}
        />
      );

      expect(screen.getByText('Carregando especialidades...')).toBeInTheDocument();
      expect(screen.getByText('Aguarde um momento')).toBeInTheDocument();
      expect(screen.queryByText('Nenhuma especialidade disponível')).not.toBeInTheDocument();
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Normal Operation Tests', () => {
    it('should render specialties when valid array is provided', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
        />
      );

      expect(screen.getByText('Selecione a Especialidade')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma especialidade')).toBeInTheDocument();
      expect(screen.getByText('Escolha a área médica')).toBeInTheDocument();
      
      // Select should be enabled when specialties are available
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
      
      // Should show count of available specialties (text is split across elements)
      expect(screen.getByText(/4.*especialidade.*disponível/)).toBeInTheDocument();
    });

    it('should call onChange when specialty is selected', () => {
      const mockOnChange = vi.fn();
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          onChange={mockOnChange}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      // Click on first specialty option
      const specialtyOption = screen.getByText('Cardiologia');
      fireEvent.click(specialtyOption);
      
      expect(mockOnChange).toHaveBeenCalledWith('Cardiologia');
    });

    it('should display selected specialty value', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          selectedSpecialty="Cardiologia"
        />
      );

      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
      expect(screen.getByText('Especialidade selecionada')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          disabled={true}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          isLoading={true}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show next button when onNext prop is provided', () => {
      const mockOnNext = vi.fn();
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          selectedSpecialty="Cardiologia"
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByText('Próximo');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton.closest('button')).not.toBeDisabled();
    });

    it('should disable next button when no specialty is selected', () => {
      const mockOnNext = vi.fn();
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByText('Próximo');
      expect(nextButton.closest('button')).toBeDisabled();
    });

    it('should call onNext when next button is clicked', () => {
      const mockOnNext = vi.fn();
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          selectedSpecialty="Cardiologia"
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByText('Próximo');
      fireEvent.click(nextButton);
      
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle specialties with special characters', () => {
      const specialSpecialties = [
        'Ginecologia & Obstetrícia',
        'Otorrinolaringologia',
        'Anestesiologia'
      ];

      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={specialSpecialties}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      expect(screen.getByText('Ginecologia & Obstetrícia')).toBeInTheDocument();
      expect(screen.getByText('Otorrinolaringologia')).toBeInTheDocument();
      expect(screen.getByText('Anestesiologia')).toBeInTheDocument();
    });

    it('should handle single specialty in array', () => {
      const singleSpecialty = ['Cardiologia'];

      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={singleSpecialty}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
      
      expect(screen.getByText(/1.*especialidade.*disponível/)).toBeInTheDocument();
      
      fireEvent.click(selectTrigger);
      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
    });

    it('should handle rapid state changes from undefined to populated', () => {
      const { rerender } = render(
        <SpecialtySelect
          {...defaultProps}
          specialties={undefined}
        />
      );

      // Initially should show placeholder text
      expect(screen.getByText('Selecione uma especialidade')).toBeInTheDocument();
      
      // Update with specialties
      rerender(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
        />
      );

      // Should now show normal placeholder and count
      expect(screen.getByText('Selecione uma especialidade')).toBeInTheDocument();
      expect(screen.getByText(/4.*especialidade.*disponível/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
        />
      );

      const selectTrigger = screen.getByRole('combobox');
      
      // Should be focusable
      selectTrigger.focus();
      expect(selectTrigger).toHaveFocus();
      
      // Should open on Enter key
      fireEvent.keyDown(selectTrigger, { key: 'Enter' });
      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
    });

    it('should have proper button accessibility for next button', () => {
      const mockOnNext = vi.fn();
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={mockSpecialties}
          selectedSpecialty="Cardiologia"
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByText('Próximo').closest('button');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).not.toBeDisabled();
    });
  });
});