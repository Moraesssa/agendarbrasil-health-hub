import type { ReactNode } from 'react';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import GerenciarAgenda from '@/pages/GerenciarAgenda';
import { AgendaFormData, diasDaSemana } from '@/types/agenda';

vi.mock('@/components/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock('@/components/agenda/AgendaPageHeader', () => ({
  AgendaPageHeader: () => <div data-testid="agenda-page-header" />,
}));

vi.mock('@/components/agenda/AgendaErrorState', () => ({
  AgendaErrorState: () => <div data-testid="agenda-error-state" />,
}));

vi.mock('@/components/PageLoader', () => ({
  PageLoader: () => <div>Carregando</div>,
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', () => {
  const React = require('react');

  const SelectContext = React.createContext<{
    handleValueChange: (value: string) => void;
    toggleOpen: () => void;
    isOpen: boolean;
  }>({
    handleValueChange: () => {},
    toggleOpen: () => {},
    isOpen: false,
  });

  const Select = ({ children, onValueChange }: { children: ReactNode; onValueChange?: (value: string) => void }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleValueChange = (value: string) => {
      onValueChange?.(value);
      setIsOpen(false);
    };

    const toggleOpen = () => setIsOpen((prev: boolean) => !prev);

    return (
      <SelectContext.Provider value={{ handleValueChange, toggleOpen, isOpen }}>
        {children}
      </SelectContext.Provider>
    );
  };

  const SelectTrigger = ({ children, ...props }: { children: ReactNode }) => {
    const { toggleOpen } = React.useContext(SelectContext);

    return (
      <button type="button" onClick={toggleOpen} {...props}>
        {children}
      </button>
    );
  };

  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;

  const SelectContent = ({ children }: { children: ReactNode }) => {
    const { isOpen } = React.useContext(SelectContext);
    if (!isOpen) return null;
    return <div>{children}</div>;
  };

  const SelectItem = ({ children, value, ...props }: { children: ReactNode; value: string }) => {
    const { handleValueChange } = React.useContext(SelectContext);

    return (
      <button type="button" onClick={() => handleValueChange(value)} {...props}>
        {children}
      </button>
    );
  };

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

const mockLocais = [{ id: '1', nome_local: 'Clínica Central' }];
const fetchInitialDataMock = vi.fn();

let horariosParaTeste: AgendaFormData['horarios'] = diasDaSemana.reduce((acc, dia) => {
  acc[dia.key] = [];
  return acc;
}, {} as AgendaFormData['horarios']);

const criarHorariosComBloco = (): AgendaFormData['horarios'] => {
  return diasDaSemana.reduce((acc, dia) => {
    acc[dia.key] = dia.key === 'segunda'
      ? [{ ativo: true, inicio: '08:00', fim: '12:00', local_id: '1' }]
      : [];
    return acc;
  }, {} as AgendaFormData['horarios']);
};

vi.mock('@/hooks/agenda/useAgendaData', () => ({
  useAgendaData: (reset: (values: Partial<AgendaFormData>) => void) => {
    fetchInitialDataMock.mockImplementation(() => {
      reset({ horarios: horariosParaTeste });
    });

    return {
      loading: false,
      locais: mockLocais,
      error: null,
      fetchInitialData: fetchInitialDataMock,
    };
  },
}));

const onSubmitMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/agenda/useAgendaSubmit', () => ({
  useAgendaSubmit: () => ({
    onSubmit: onSubmitMock,
    isSubmitting: false,
  }),
}));

describe('GerenciarAgenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    horariosParaTeste = criarHorariosComBloco();
  });

  it('permite remover o último bloco e salvar a agenda vazia', async () => {
    render(<GerenciarAgenda />);

    const bloco = await screen.findByTestId('schedule-block-segunda-0');
    const removerButton = within(bloco).getByTestId('remove-schedule-block-segunda-0');
    fireEvent.click(removerButton);

    await waitFor(() => {
      expect(screen.queryByTestId('schedule-block-segunda-0')).not.toBeInTheDocument();
    });

    const salvarButton = screen.getByRole('button', { name: 'Salvar Alterações' });
    await waitFor(() => expect(salvarButton).toBeEnabled());

    fireEvent.click(salvarButton);

    await waitFor(() => expect(onSubmitMock).toHaveBeenCalled());

    const submittedData = onSubmitMock.mock.calls[0][0] as AgendaFormData;
    diasDaSemana.forEach((dia) => {
      expect(submittedData.horarios[dia.key]).toEqual([]);
    });
  });

  it('permite adicionar um bloco, preencher os campos e salvar sem o overlay bloquear o fluxo', async () => {
    horariosParaTeste = diasDaSemana.reduce((acc, dia) => {
      acc[dia.key] = [];
      return acc;
    }, {} as AgendaFormData['horarios']);

    render(<GerenciarAgenda />);

    const adicionarButtons = await screen.findAllByRole('button', { name: 'Adicionar Bloco' });
    const adicionarSegunda = adicionarButtons[0];
    fireEvent.click(adicionarSegunda);

    const inicioInput = await screen.findByTestId('schedule-start-segunda-0');
    const fimInput = await screen.findByTestId('schedule-end-segunda-0');
    const localSelect = await screen.findByTestId('schedule-local-select-segunda-0');

    fireEvent.change(inicioInput, { target: { value: '09:30' } });
    fireEvent.change(fimInput, { target: { value: '11:30' } });

    fireEvent.click(localSelect);
    const opcaoLocal = await screen.findByText('Clínica Central');
    fireEvent.click(opcaoLocal);

    expect(screen.queryByTestId('unsaved-changes-overlay')).not.toBeInTheDocument();

    const salvarButton = screen.getByRole('button', { name: 'Salvar Alterações' });
    expect(salvarButton).toBeEnabled();

    fireEvent.click(salvarButton);

    await waitFor(() => expect(onSubmitMock).toHaveBeenCalledTimes(1));

    const submittedData = onSubmitMock.mock.calls[0][0] as AgendaFormData;
    expect(submittedData.horarios.segunda).toEqual([
      {
        ativo: true,
        inicio: '09:30',
        fim: '11:30',
        local_id: '1'
      }
    ]);
  });
});
