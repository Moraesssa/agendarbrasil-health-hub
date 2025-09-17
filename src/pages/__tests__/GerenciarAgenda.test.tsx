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
    const removerButton = within(bloco).getByRole('button');
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
});
