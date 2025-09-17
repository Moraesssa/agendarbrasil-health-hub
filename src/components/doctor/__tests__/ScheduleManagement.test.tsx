import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ScheduleManagement } from '@/components/doctor/ScheduleManagement';
import { medicoService } from '@/services/medicoService';

vi.mock('@/integrations/supabase/client', () => {
  const mockLocationsResponse = [
    { id: 101, nome_local: 'Clínica Centro' },
    { id: 202, nome_local: 'Clínica Norte' }
  ];

  const mockMedicoConfig = {
    duracaoConsulta: 30,
    bufferMinutos: 0,
    horarioAtendimento: {
      segunda: [
        {
          inicio: '08:00',
          fim: '12:00',
          ativo: true,
          local_id: ''
        }
      ]
    }
  };

  const medicosQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn()
  };

  medicosQuery.select.mockReturnValue(medicosQuery);
  medicosQuery.eq.mockReturnValue(medicosQuery);
  medicosQuery.single.mockResolvedValue({
    data: { configuracoes: mockMedicoConfig },
    error: null
  });

  const locationsQuery = {
    select: vi.fn(),
    eq: vi.fn()
  };

  locationsQuery.select.mockReturnValue(locationsQuery);
  locationsQuery.eq.mockImplementation((column: string) => {
    if (column === 'ativo') {
      return Promise.resolve({
        data: mockLocationsResponse,
        error: null
      });
    }

    return locationsQuery;
  });

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'medicos') {
          return medicosQuery;
        }

        if (table === 'locais_atendimento') {
          return locationsQuery;
        }

        throw new Error(`Unexpected table: ${table}`);
      })
    }
  };
});

const mockUser = { id: 'user-123' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

vi.mock('@/services/medicoService', () => ({
  medicoService: {
    saveMedicoData: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

vi.mock('@/components/ui/select', () => {
  const Select = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-select">{children}</div>
  );

  const SelectTrigger = ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  );

  const SelectValue = ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  );

  const SelectContent = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const SelectItem = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
  };
});

vi.mock('@/components/ui/dialog', () => {
  const Dialog = ({ children, open }: { children: React.ReactNode; open?: boolean }) => (
    <div>{open ? children : null}</div>
  );

  const DialogContent = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const DialogHeader = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const DialogTitle = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  const DialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
  };
});

describe('ScheduleManagement', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it('renders the locations select when editing a block without a location', async () => {
    render(<ScheduleManagement />);

    const addButtons = await screen.findAllByRole('button', { name: 'Adicionar Horário' });
    fireEvent.click(addButtons[0]);

    await screen.findByLabelText('Horário de Início');

    const selectPlaceholder = await screen.findByText('Aplicar a todos os locais');
    const selectTrigger = selectPlaceholder.closest('button');
    expect(selectTrigger).toBeTruthy();
  });

  it('allows adding a block and saving without being blocked by the unsaved changes notice', async () => {
    render(<ScheduleManagement />);

    const addButtons = await screen.findAllByRole('button', { name: 'Adicionar Horário' });
    fireEvent.click(addButtons[0]);

    const startInput = await screen.findByLabelText('Horário de Início');
    const endInput = screen.getByLabelText('Horário de Fim');

    fireEvent.change(startInput, { target: { value: '09:00' } });
    fireEvent.change(endInput, { target: { value: '18:00' } });

    const addDialogButton = screen.getByRole('button', { name: /^Adicionar$/ });
    fireEvent.click(addDialogButton);

    await screen.findByText('Salve ou desfazer as alterações para continuar gerenciando seus horários.');

    const saveButtons = screen.getAllByRole('button', { name: 'Salvar Configurações' });
    const primarySaveButton = saveButtons.find(button => !button.closest('[role="alert"]'));
    expect(primarySaveButton).toBeDefined();
    expect(primarySaveButton).toBeEnabled();

    fireEvent.click(primarySaveButton!);

    await waitFor(() => {
      expect(medicoService.saveMedicoData).toHaveBeenCalledTimes(1);
    });
  });
});
