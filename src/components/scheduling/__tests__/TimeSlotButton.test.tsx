import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimeSlotButton } from '../TimeSlotButton';

// Mock the tooltip components
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
}));

describe('TimeSlotButton', () => {
  const defaultProps = {
    time: '09:00',
    available: true,
    selected: false,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders time slot button with correct time', () => {
    render(<TimeSlotButton {...defaultProps} />);
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('calls onClick when clicked and available', () => {
    const onClick = vi.fn();
    render(<TimeSlotButton {...defaultProps} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<TimeSlotButton {...defaultProps} disabled={true} onClick={onClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when not available', () => {
    const onClick = vi.fn();
    render(<TimeSlotButton {...defaultProps} available={false} onClick={onClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows selected state correctly', () => {
    render(<TimeSlotButton {...defaultProps} selected={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-orange-500');
  });

  it('shows location badge when showLocationBadge is true', () => {
    render(
      <TimeSlotButton 
        {...defaultProps} 
        locationId="loc-1" 
        locationName="Hospital Test"
        showLocationBadge={true}
      />
    );
    
    // Check if the building icon is present (location badge)
    const buildingIcon = screen.getByRole('button').querySelector('svg');
    expect(buildingIcon).toBeInTheDocument();
  });

  it('shows tooltip with location information', () => {
    render(
      <TimeSlotButton 
        {...defaultProps} 
        locationId="loc-1" 
        locationName="Hospital Test"
      />
    );
    
    // The tooltip content should be rendered
    expect(screen.getByText('Hospital Test')).toBeInTheDocument();
    expect(screen.getByText('Horário: 09:00')).toBeInTheDocument();
  });

  it('applies correct styling for location filtering', () => {
    render(
      <TimeSlotButton 
        {...defaultProps} 
        locationId="loc-1" 
        isLocationFiltered={true}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-60');
  });

  it('has correct accessibility attributes', () => {
    render(
      <TimeSlotButton 
        {...defaultProps} 
        locationName="Hospital Test"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Horário 09:00 disponível - Hospital Test');
  });

  it('shows unavailable state correctly', () => {
    render(<TimeSlotButton {...defaultProps} available={false} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-40');
    expect(button).toHaveClass('line-through');
    expect(button).toHaveAttribute('aria-label', 'Horário 09:00 indisponível');
  });
});