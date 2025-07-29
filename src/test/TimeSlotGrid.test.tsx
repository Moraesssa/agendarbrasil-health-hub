import { render, screen, fireEvent } from './test-utils';
import { describe, it, expect, vi } from 'vitest';
import { TimeSlotGrid } from '@/components/scheduling/TimeSlotGrid';

// Mock data for testing
const mockTimeSlots = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: false },
  { time: '14:00', available: true },
];

const defaultProps = {
  selectedTime: '',
  isLoading: false,
  onChange: vi.fn(),
  disabled: false
};

describe('TimeSlotGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Defensive Programming Tests', () => {
    it('should handle undefined timeSlots gracefully', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={undefined}
        />
      );

      expect(screen.getByText('Selecione o Horário')).toBeInTheDocument();
      expect(screen.getByText('Nenhum horário disponível')).toBeInTheDocument();
      expect(screen.getByText('Selecione outra data para ver os horários')).toBeInTheDocument();
    });

    it('should handle null timeSlots gracefully', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={null}
        />
      );

      expect(screen.getByText('Selecione o Horário')).toBeInTheDocument();
      expect(screen.getByText('Nenhum horário disponível')).toBeInTheDocument();
      expect(screen.getByText('Selecione outra data para ver os horários')).toBeInTheDocument();
    });

    it('should handle empty timeSlots array gracefully', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={[]}
        />
      );

      expect(screen.getByText('Selecione o Horário')).toBeInTheDocument();
      expect(screen.getByText('Nenhum horário disponível')).toBeInTheDocument();
      expect(screen.getByText('Selecione outra data para ver os horários')).toBeInTheDocument();
    });

    it('should not show empty message when loading', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={undefined}
          isLoading={true}
        />
      );

      expect(screen.getByText('Carregando horários disponíveis')).toBeInTheDocument();
      expect(screen.getByText('Verificando agenda...')).toBeInTheDocument();
      expect(screen.queryByText('Nenhum horário disponível')).not.toBeInTheDocument();
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Normal Operation Tests', () => {
    it('should render time slots correctly when data is available', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
        />
      );

      expect(screen.getByText('Selecione o Horário')).toBeInTheDocument();
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('11:00')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
      
      // Should show count of available slots (text is split across elements)
      expect(screen.getByText(/3.*horário.*disponível/)).toBeInTheDocument();
    });

    it('should handle time slot selection', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
          onChange={mockOnChange}
        />
      );

      const timeSlotButton = screen.getByText('09:00').closest('button');
      expect(timeSlotButton).toBeInTheDocument();
      
      fireEvent.click(timeSlotButton!);
      expect(mockOnChange).toHaveBeenCalledWith('09:00');
    });

    it('should show selected time slot with correct styling', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
          selectedTime="09:00"
        />
      );

      const selectedButton = screen.getByText('09:00').closest('button');
      expect(selectedButton).toHaveClass('border-orange-500');
      expect(selectedButton).toHaveClass('bg-orange-100');
    });

    it('should disable unavailable time slots', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
        />
      );

      const unavailableButton = screen.getByText('11:00').closest('button');
      expect(unavailableButton).toBeDisabled();
      expect(unavailableButton).toHaveClass('line-through');
    });

    it('should disable all buttons when component is disabled', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should show next button when onNext prop is provided', () => {
      const mockOnNext = vi.fn();
      const mockOnPrevious = vi.fn();
      
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
          selectedTime="09:00"
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      );

      const nextButton = screen.getByText('Próximo');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton.closest('button')).not.toBeDisabled();
    });

    it('should show previous button when onPrevious prop is provided', () => {
      const mockOnPrevious = vi.fn();
      const mockOnNext = vi.fn();
      
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      );

      const previousButton = screen.getByText('Anterior');
      expect(previousButton).toBeInTheDocument();
    });
  });

  describe('Loading State Tests', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
          isLoading={true}
        />
      );

      expect(screen.getByText('Carregando horários disponíveis')).toBeInTheDocument();
      expect(screen.getByText('Verificando agenda...')).toBeInTheDocument();
      expect(screen.queryByText('09:00')).not.toBeInTheDocument();
      
      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading indicator when isLoading is false', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
        />
      );

      expect(screen.queryByText('Carregando horários disponíveis')).not.toBeInTheDocument();
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed available and unavailable slots', () => {
      const mixedSlots = [
        { time: '09:00', available: true },
        { time: '10:00', available: false },
        { time: '11:00', available: true },
      ];

      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mixedSlots}
        />
      );

      const availableButton1 = screen.getByText('09:00').closest('button');
      const unavailableButton = screen.getByText('10:00').closest('button');
      const availableButton2 = screen.getByText('11:00').closest('button');

      expect(availableButton1).not.toBeDisabled();
      expect(unavailableButton).toBeDisabled();
      expect(availableButton2).not.toBeDisabled();
      
      // Should show count of available slots (text is split across elements)
      expect(screen.getByText(/2.*horário.*disponível/)).toBeInTheDocument();
    });

    it('should handle single time slot', () => {
      const singleSlot = [{ time: '09:00', available: true }];

      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={singleSlot}
        />
      );

      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText(/1.*horário.*disponível/)).toBeInTheDocument();
    });

    it('should handle all unavailable slots', () => {
      const unavailableSlots = [
        { time: '09:00', available: false },
        { time: '10:00', available: false },
      ];

      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={unavailableSlots}
        />
      );

      // Should show no available slots message
      expect(screen.getByText('Nenhum horário disponível')).toBeInTheDocument();
      expect(screen.getByText('Selecione outra data para ver os horários')).toBeInTheDocument();
    });

    it('should handle rapid state changes from undefined to populated', () => {
      const { rerender } = render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={undefined}
        />
      );

      // Initially should show no time slots available
      expect(screen.getByText('Nenhum horário disponível')).toBeInTheDocument();
      
      // Update with time slots
      rerender(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
        />
      );

      // Should now show time slots
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText(/3.*horário.*disponível/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Buttons already have role="button" implicitly
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should be keyboard accessible', () => {
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
        />
      );

      const firstButton = screen.getByText('09:00').closest('button');
      
      // Should be focusable
      firstButton?.focus();
      expect(firstButton).toHaveFocus();
    });

    it('should have proper navigation button accessibility', () => {
      const mockOnNext = vi.fn();
      const mockOnPrevious = vi.fn();
      
      render(
        <TimeSlotGrid
          {...defaultProps}
          timeSlots={mockTimeSlots}
          selectedTime="09:00"
          onNext={mockOnNext}
          onPrevious={mockOnPrevious}
        />
      );

      const nextButton = screen.getByText('Próximo').closest('button');
      const previousButton = screen.getByText('Anterior').closest('button');
      
      expect(nextButton).toBeInTheDocument();
      expect(previousButton).toBeInTheDocument();
      expect(nextButton).not.toBeDisabled();
      expect(previousButton).not.toBeDisabled();
    });
  });
});