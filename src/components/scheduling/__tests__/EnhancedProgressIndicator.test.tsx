import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedProgressIndicator } from '../EnhancedProgressIndicator';

const defaultProps = {
  currentStep: 3,
  totalSteps: 7,
  stepTitles: ['Especialidade', 'Estado', 'Cidade', 'Médico', 'Data', 'Horário', 'Confirmação'],
  completedSteps: [1, 2],
  onStepClick: vi.fn(),
  errorSteps: [],
};

describe('EnhancedProgressIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 3.1: Visual progress feedback maintained', () => {
    it('should display progress navigation with proper role', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const progressNav = screen.getByRole('navigation', { name: /progresso do agendamento/i });
      expect(progressNav).toBeInTheDocument();
    });

    it('should show progress bar with proper ARIA attributes', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '3');
      expect(progressBar).toHaveAttribute('aria-valuemin', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '7');
    });
  });

  describe('Requirement 3.2: Current step visually highlighted', () => {
    it('should highlight current step with proper styling', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      // Check desktop version
      const currentStepButton = screen.getByRole('button', { name: /etapa 3.*atual/i });
      expect(currentStepButton).toHaveClass('bg-blue-600', 'text-white', 'border-blue-600');
    });

    it('should show current step in mobile version', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      // Mobile version should show current step info
      const mobileCurrentStep = screen.getByText('Cidade');
      expect(mobileCurrentStep).toBeInTheDocument();
      
      const stepCounter = screen.getByText('Etapa 3 de 7');
      expect(stepCounter).toBeInTheDocument();
    });
  });

  describe('Requirement 3.3: Completed steps show completion indicator', () => {
    it('should show check icons for completed steps', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      // Check for completed step buttons
      const completedStep1 = screen.getByRole('button', { name: /etapa 1.*concluída/i });
      expect(completedStep1).toHaveClass('bg-green-600', 'text-white', 'border-green-600');
      
      const completedStep2 = screen.getByRole('button', { name: /etapa 2.*concluída/i });
      expect(completedStep2).toHaveClass('bg-green-600', 'text-white', 'border-green-600');
    });

    it('should display step titles for completed steps', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const step1Title = screen.getByText('Especialidade');
      expect(step1Title).toHaveClass('text-green-600');
      
      const step2Title = screen.getByText('Estado');
      expect(step2Title).toHaveClass('text-green-600');
    });
  });

  describe('Requirement 3.4: Clear error messages for missing fields', () => {
    it('should highlight error steps with red styling', () => {
      render(<EnhancedProgressIndicator {...defaultProps} errorSteps={[4]} />);
      
      const errorStep = screen.getByRole('button', { name: /etapa 4.*com erro/i });
      expect(errorStep).toHaveClass('bg-red-600', 'text-white', 'border-red-600', 'animate-pulse');
    });

    it('should show error icon for error steps', () => {
      render(<EnhancedProgressIndicator {...defaultProps} errorSteps={[4]} />);
      
      const errorStep = screen.getByRole('button', { name: /etapa 4.*com erro/i });
      const alertIcon = errorStep.querySelector('[data-lucide="alert-circle"]');
      expect(alertIcon).toBeInTheDocument();
    });
  });

  describe('Requirement 3.5: Mobile navigation usability maintained', () => {
    it('should have mobile-specific layout', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      // Check for mobile-specific classes
      const mobileContainer = screen.getByRole('navigation').querySelector('.md\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });

    it('should show mobile progress bar', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const mobileProgressBar = screen.getByRole('progressbar');
      expect(mobileProgressBar).toBeInTheDocument();
    });

    it('should have touch-friendly step dots', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(7);
    });
  });

  describe('Accessibility', () => {
    it('should have proper screen reader content', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      // Check for screen reader only content
      const srContent = screen.getByText(/progresso do agendamento: etapa 3 de 7/i);
      expect(srContent).toBeInTheDocument();
      expect(srContent.parentElement).toHaveClass('sr-only');
    });

    it('should have proper ARIA labels for step buttons', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const step1Button = screen.getByRole('button', { name: /etapa 1.*especialidade.*concluída/i });
      expect(step1Button).toHaveAttribute('aria-describedby', 'step-1-title');
    });

    it('should indicate current step with aria-current', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const currentStepButton = screen.getByRole('button', { name: /etapa 3.*atual/i });
      expect(currentStepButton).toHaveAttribute('aria-current', 'step');
    });

    it('should have proper tabindex for clickable steps', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      // Completed and current steps should be focusable
      const clickableStep = screen.getByRole('button', { name: /etapa 1.*concluída/i });
      expect(clickableStep).toHaveAttribute('tabindex', '0');
      
      // Future steps should not be focusable
      const futureStep = screen.getByRole('button', { name: /etapa 5/i });
      expect(futureStep).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Interaction', () => {
    it('should call onStepClick for clickable steps', () => {
      const mockOnStepClick = vi.fn();
      render(<EnhancedProgressIndicator {...defaultProps} onStepClick={mockOnStepClick} />);
      
      const completedStep = screen.getByRole('button', { name: /etapa 1.*concluída/i });
      fireEvent.click(completedStep);
      
      expect(mockOnStepClick).toHaveBeenCalledWith(1);
    });

    it('should not call onStepClick for non-clickable steps', () => {
      const mockOnStepClick = vi.fn();
      render(<EnhancedProgressIndicator {...defaultProps} onStepClick={mockOnStepClick} />);
      
      const futureStep = screen.getByRole('button', { name: /etapa 5/i });
      fireEvent.click(futureStep);
      
      expect(mockOnStepClick).not.toHaveBeenCalled();
    });

    it('should show proper cursor styles', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const clickableStep = screen.getByRole('button', { name: /etapa 1.*concluída/i });
      expect(clickableStep).toHaveClass('cursor-pointer');
      
      const nonClickableStep = screen.getByRole('button', { name: /etapa 5/i });
      expect(nonClickableStep).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Loading states', () => {
    it('should show loading state for specific step', () => {
      render(<EnhancedProgressIndicator {...defaultProps} loadingStep={3} />);
      
      const loadingStep = screen.getByRole('button', { name: /etapa 3.*carregando/i });
      expect(loadingStep).toHaveClass('bg-blue-100', 'text-blue-600', 'border-blue-300');
      
      const spinner = loadingStep.querySelector('[data-lucide="loader-2"]');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should disable interaction during loading', () => {
      const mockOnStepClick = vi.fn();
      render(<EnhancedProgressIndicator {...defaultProps} onStepClick={mockOnStepClick} loadingStep={3} />);
      
      const loadingStep = screen.getByRole('button', { name: /etapa 3.*carregando/i });
      fireEvent.click(loadingStep);
      
      expect(mockOnStepClick).not.toHaveBeenCalled();
    });
  });

  describe('Visual states', () => {
    it('should show pending steps with gray styling', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const pendingStep = screen.getByRole('button', { name: /etapa 5/i });
      expect(pendingStep).toHaveClass('bg-white', 'text-gray-400', 'border-gray-300');
    });

    it('should show connector lines between steps', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      // Desktop version should have connector lines
      const desktopContainer = screen.getByRole('navigation').querySelector('.hidden.md\\:block');
      expect(desktopContainer).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    it('should have desktop-specific layout', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const desktopContainer = screen.getByRole('navigation').querySelector('.hidden.md\\:block');
      expect(desktopContainer).toBeInTheDocument();
    });

    it('should have mobile-specific layout', () => {
      render(<EnhancedProgressIndicator {...defaultProps} />);
      
      const mobileContainer = screen.getByRole('navigation').querySelector('.md\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });
  });
});