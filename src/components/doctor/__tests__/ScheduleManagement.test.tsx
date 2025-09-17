import { render, screen, fireEvent } from '@testing-library/react';

import { ScheduleManagement } from '@/components/doctor/ScheduleManagement';

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

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' }
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
    <div>{children}</div>
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

    await screen.findByText('Adicionar Horário');

    const selectPlaceholder = await screen.findByText('Aplicar a todos os locais');
    const selectTrigger = selectPlaceholder.closest('button');
    expect(selectTrigger).toBeTruthy();
  });
});
