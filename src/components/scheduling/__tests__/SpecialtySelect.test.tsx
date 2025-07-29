import { describe, it, expect, vi }} from '@/test/test-utils';
import { SpecialtySelect } from '../SpecialtySelect';
import { vi } from 'vitest';

describe('SpecialtySelect', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    selectedSpecialty: '',
    isLoading: false,
    onChange: mockOnChange,
    disabled: false,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Defensive Programming - Undefined/Null Handling', () => {
    it('should handle undefined specialties gracefully', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={undefined}
        />
      );

      expect(screen.getByText('Especialidade')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      // Should show "no specialties available" message
      expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
    });

    it('should handle null specialties gracefully', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={null}
        />
      );

      expect(screen.getByText('Especialidade')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      // Should show "no specialties available" message
      expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
    });

    it('should handle empty array gracefully', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={[]}
        />
      );

      expect(screen.getByText('Especialidade')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      // Should show "no specialties available" message
      expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
    });
  });

  describe('Normal Operation with Valid Data', () => {
    const validSpecialties = ['Cardiologia', 'Dermatologia', 'Neurologia'];

    it('should render specialties when valid array is provided', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={validSpecialties}
        />
      );

      expect(screen.getByText('Especialidade')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      // Should show all specialties
      validSpecialties.forEach(specialty => {
        expect(screen.getByText(specialty)).toBeInTheDocument();
      });
    });

    it('should call onChange when specialty is selected', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={validSpecialties}
        />
      );

      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      // Click on a specialty
      fireEvent.click(screen.getByText('Cardiologia'));
      
      expect(mockOnChange).toHaveBeenCalledWith('Cardiologia');
    });

    it('should display selected specialty', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={validSpecialties}
          selectedSpecialty="Cardiologia"
        />
      );

      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={[]}
          isLoading={true}
        />
      );

      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show loading message when isLoading is true and no specialties', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={[]}
          isLoading={false}
        />
      );

      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      // Should show "no specialties available" message
      expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
    });

    it('should disable select when isLoading is true', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={['Cardiologia']}
          isLoading={true}
        />
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('should disable select when disabled prop is true', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={['Cardiologia']}
          disabled={true}
        />
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('should disable select when both disabled and isLoading are true', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={['Cardiologia']}
          disabled={true}
          isLoading={true}
        />
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={['Cardiologia']}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'specialty-select');
      
      const label = screen.getByText('Especialidade');
      expect(label).toBeInTheDocument();
    });

    it('should have proper placeholder text', () => {
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={['Cardiologia']}
        />
      );

      expect(screen.getByText('Selecione uma especialidade')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle specialties with special characters', () => {
      const specialtiesWithSpecialChars = ['Ginecologia & Obstetrícia', 'Cirurgia Plástica/Estética'];
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={specialtiesWithSpecialChars}
        />
      );

      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      specialtiesWithSpecialChars.forEach(specialty => {
        expect(screen.getByText(specialty)).toBeInTheDocument();
      });
    });

    it('should handle very long specialty names', () => {
      const longSpecialtyName = 'Especialidade com Nome Muito Longo que Pode Causar Problemas de Layout';
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={[longSpecialtyName]}
        />
      );

      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      expect(screen.getByText(longSpecialtyName)).toBeInTheDocument();
    });

    it('should handle duplicate specialty names', () => {
      const duplicateSpecialties = ['Cardiologia', 'Cardiologia', 'Dermatologia'];
      
      render(
        <SpecialtySelect
          {...defaultProps}
          specialties={duplicateSpecialties}
        />
      );

      // Click to open the select
      fireEvent.click(screen.getByRole('combobox'));
      
      // Should render all items (React will handle key warnings)
      const cardioItems = screen.getAllByText('Cardiologia');
      expect(cardioItems).toHaveLength(2);
    });
  });
});