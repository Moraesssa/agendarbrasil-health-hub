import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FamilyMemberSelect } from '../FamilyMemberSelect';
import { FamilyMember } from '@/types/family';

const mockFamilyMembers: FamilyMember[] = [
  {
    id: '1',
    family_member_id: 'member-1',
    display_name: 'João Silva',
    email: 'joao@example.com',
    relationship: 'child',
    status: 'active',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    family_member_id: 'member-2',
    display_name: 'Maria Silva',
    email: 'maria@example.com',
    relationship: 'spouse',
    status: 'active',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
];

const defaultProps = {
  familyMembers: mockFamilyMembers,
  selectedMemberId: '',
  currentUserId: 'current-user',
  currentUserName: 'Usuário Atual',
  isLoading: false,
  onChange: vi.fn(),
  disabled: false,
  showSuccess: false,
};

describe('FamilyMemberSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 2.1: Family selection section highlighted in step 7', () => {
    it('should have highlighted container with green styling', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const card = screen.getByRole('region');
      expect(card).toHaveClass('family-selection-highlight');
      expect(card).toHaveClass('border-2', 'border-green-500');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-green-50', 'to-emerald-50');
    });

    it('should have elevated shadow', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const card = screen.getByRole('region');
      expect(card).toHaveClass('shadow-lg');
    });
  });

  describe('Requirement 2.2: Contrasting colors and icons used', () => {
    it('should display users icon in header', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const icon = screen.getByRole('region').querySelector('.lucide-users');
      expect(icon).toBeInTheDocument();
    });

    it('should have prominent header with green styling', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: /agendar para/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-green-800');
    });

    it('should have descriptive subtitle', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const description = screen.getByText(/selecione para quem você está agendando/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-green-600');
    });
  });

  describe('Requirement 2.3: Section positioned before appointment summary', () => {
    it('should have proper region role and labeling', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'family-member-heading');
      expect(region).toHaveAttribute('aria-describedby', 'family-member-description');
    });
  });

  describe('Requirement 2.4: Clear indication when scheduling for self', () => {
    it('should show current user option', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      const selfOption = screen.getByText('Eu mesmo');
      expect(selfOption).toBeInTheDocument();
      
      const currentUserName = screen.getByText(defaultProps.currentUserName);
      expect(currentUserName).toBeInTheDocument();
    });

    it('should display selection status when user is selected', () => {
      render(<FamilyMemberSelect {...defaultProps} selectedMemberId="current-user" />);
      
      const selectionStatus = screen.getByRole('status');
      expect(selectionStatus).toHaveTextContent('Agendando para: Você mesmo');
    });
  });

  describe('Requirement 2.5: Visual highlighting of family member options', () => {
    it('should display family member options with proper styling', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      const familyOption = screen.getByText('João Silva');
      expect(familyOption).toBeInTheDocument();
      
      const relationshipText = screen.getByText(/filho\(a\)/i);
      expect(relationshipText).toBeInTheDocument();
    });

    it('should show success indicator when selection is made', () => {
      render(<FamilyMemberSelect {...defaultProps} selectedMemberId="member-1" showSuccess={true} />);
      
      const successIcon = screen.getByRole('region').querySelector('.lucide-user-check');
      expect(successIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Selecionar pessoa para agendamento');
      expect(select).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper heading structure', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveAttribute('id', 'family-member-heading');
    });

    it('should show error state with proper ARIA attributes', () => {
      const error = {
        field: 'familyMember',
        message: 'Seleção obrigatória',
        type: 'required' as const
      };
      
      render(<FamilyMemberSelect {...defaultProps} error={error} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Loading states', () => {
    it('should show loading skeleton when loading', () => {
      render(<FamilyMemberSelect {...defaultProps} isLoading={true} />);
      
      const loadingElement = screen.getByRole('region');
      expect(loadingElement).toHaveClass('family-selection-highlight');
    });

    it('should show loading state in select trigger', () => {
      render(<FamilyMemberSelect {...defaultProps} isLoading={true} />);
      
      // When loading, the component should show LoadingSkeleton instead of the select
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show helpful message when no family members available', () => {
      render(<FamilyMemberSelect {...defaultProps} familyMembers={[]} />);
      
      const emptyMessage = screen.getByRole('alert');
      expect(emptyMessage).toHaveTextContent('Apenas você pode agendar');
      expect(emptyMessage).toHaveTextContent('Para agendar para familiares, adicione-os em "Gerenciar Família"');
    });
  });

  describe('Interaction', () => {
    it('should call onChange when selection is made', async () => {
      const mockOnChange = vi.fn();
      render(<FamilyMemberSelect {...defaultProps} onChange={mockOnChange} />);
      
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);
      
      const option = screen.getByText('João Silva');
      fireEvent.click(option);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('member-1');
      });
    });

    it('should be disabled when disabled prop is true', () => {
      render(<FamilyMemberSelect {...defaultProps} disabled={true} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('Responsive design', () => {
    it('should have touch-friendly sizing', () => {
      render(<FamilyMemberSelect {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('touch-manipulation');
      expect(select).toHaveClass('h-11', 'sm:h-12');
    });
  });
});