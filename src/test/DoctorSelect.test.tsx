import { render, screen, fireEvent } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { DoctorSelect } from '@/components/scheduling/DoctorSelect';

const mockDoctors = [
  { id: '1', display_name: 'Dr. João Silva' },
  { id: '2', display_name: 'Dr. Maria Santos' },
  { id: '3', display_name: 'Dr. Pedro Oliveira' }
];

const defaultProps = {
  selectedDoctor: '',
  isLoading: false,
  onChange: vi.fn(),
  disabled: false
};

describe('DoctorSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Defensive checks for undefined/null data', () => {
    it('should handle undefined doctors gracefully', () => {
      render(<DoctorSelect {...defaultProps} doctors={undefined} />);
      
      expect(screen.getByText('Selecione o Médico')).toBeInTheDocument();
      expect(screen.getByText('Selecione o médico')).toBeInTheDocument();
      expect(screen.getByText('Nenhum médico encontrado para os filtros selecionados')).toBeInTheDocument();
    });

    it('should handle null doctors gracefully', () => {
      render(<DoctorSelect {...defaultProps} doctors={null} />);
      
      expect(screen.getByText('Selecione o Médico')).toBeInTheDocument();
      expect(screen.getByText('Selecione o médico')).toBeInTheDocument();
      expect(screen.getByText('Nenhum médico encontrado para os filtros selecionados')).toBeInTheDocument();
    });

    it('should handle empty doctors array', () => {
      render(<DoctorSelect {...defaultProps} doctors={[]} />);
      
      expect(screen.getByText('Selecione o Médico')).toBeInTheDocument();
      expect(screen.getByText('Selecione o médico')).toBeInTheDocument();
      expect(screen.getByText('Nenhum médico encontrado para os filtros selecionados')).toBeInTheDocument();
    });

    it('should disable select when doctors is undefined', () => {
      render(<DoctorSelect {...defaultProps} doctors={undefined} />);
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should disable select when doctors is null', () => {
      render(<DoctorSelect {...defaultProps} doctors={null} />);
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should disable select when doctors is empty array', () => {
      render(<DoctorSelect {...defaultProps} doctors={[]} />);
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });
  });

  describe('Normal operation with valid data', () => {
    it('should render doctors when valid array is provided', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} />);
      
      expect(screen.getByText('Selecione o Médico')).toBeInTheDocument();
      expect(screen.getByText('Selecione o médico')).toBeInTheDocument();
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
    });

    it('should not show empty message when doctors are available', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} />);
      
      expect(screen.queryByText('Nenhum médico encontrado para os filtros selecionados.')).not.toBeInTheDocument();
    });

    it('should call onChange when a doctor is selected', () => {
      const mockOnChange = vi.fn();
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} onChange={mockOnChange} />);
      
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      const doctorOption = screen.getByText('Dr. João Silva');
      fireEvent.click(doctorOption);
      
      expect(mockOnChange).toHaveBeenCalledWith('1');
    });

    it('should display selected doctor value', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} selectedDoctor="2" />);
      
      expect(screen.getByText('Dr. Maria Santos')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} isLoading={true} />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable select when loading', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} isLoading={true} />);
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should not show empty message when loading', () => {
      render(<DoctorSelect {...defaultProps} doctors={[]} isLoading={true} />);
      
      expect(screen.queryByText('Nenhum médico encontrado para os filtros selecionados.')).not.toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('should disable select when disabled prop is true', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} disabled={true} />);
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeDisabled();
    });

    it('should not show empty message when disabled', () => {
      render(<DoctorSelect {...defaultProps} doctors={[]} disabled={true} />);
      
      expect(screen.queryByText('Nenhum médico encontrado para os filtros selecionados.')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle doctors array with missing properties gracefully', () => {
      const doctorsWithMissingProps = [
        { id: '1', display_name: 'Dr. João Silva' },
        { id: '2', display_name: undefined }, // Missing display_name
        { id: '3', display_name: 'Dr. Pedro Oliveira' }
      ];
      
      render(<DoctorSelect {...defaultProps} doctors={doctorsWithMissingProps} />);
      
      expect(screen.getByText('Selecione o Médico')).toBeInTheDocument();
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
    });

    it('should handle very long doctor names', () => {
      const longNameDoctors = [
        { id: '1', display_name: 'Dr. João Silva Santos Oliveira Pereira da Costa e Silva' }
      ];
      
      render(<DoctorSelect {...defaultProps} doctors={longNameDoctors} />);
      
      expect(screen.getByText('Selecione o Médico')).toBeInTheDocument();
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
    });

    it('should handle single doctor in array', () => {
      const singleDoctor = [{ id: '1', display_name: 'Dr. João Silva' }];
      
      render(<DoctorSelect {...defaultProps} doctors={singleDoctor} />);
      
      expect(screen.getByText('Selecione o Médico')).toBeInTheDocument();
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} />);
      
      const title = screen.getByText('Selecione o Médico');
      expect(title).toBeInTheDocument();
      
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<DoctorSelect {...defaultProps} doctors={mockDoctors} />);
      
      const selectTrigger = screen.getByRole('combobox');
      selectTrigger.focus();
      expect(selectTrigger).toHaveFocus();
    });
  });
});