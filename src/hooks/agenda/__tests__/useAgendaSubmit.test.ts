import { act, renderHook } from '@testing-library/react';

import { useAgendaSubmit } from '@/hooks/agenda/useAgendaSubmit';
import { AgendaFormData, diasDaSemana } from '@/types/agenda';

const {
  toastMock,
  mockSingle,
  mockSelectEq,
  mockSelect,
  mockUpdateThrowOnError,
  mockUpdateEq,
  mockUpdate,
  fromMock,
  supabaseModule,
} = vi.hoisted(() => {
  const toast = vi.fn();
  const single = vi.fn();
  const selectEq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq: selectEq }));
  const updateThrowOnError = vi.fn();
  const updateEq = vi.fn(() => ({ throwOnError: updateThrowOnError }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const from = vi.fn((table: string) => {
    if (table === 'medicos') {
      return {
        select,
        update,
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    toastMock: toast,
    mockSingle: single,
    mockSelectEq: selectEq,
    mockSelect: select,
    mockUpdateThrowOnError: updateThrowOnError,
    mockUpdateEq: updateEq,
    mockUpdate: update,
    fromMock: from,
    supabaseModule: { supabase: { from } },
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const mockUser = { id: 'user-123' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/integrations/supabase/client', () => supabaseModule);

describe('useAgendaSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { configuracoes: {} }, error: null });
    mockUpdateThrowOnError.mockResolvedValue({ data: null, error: null });
  });

  it('persiste agenda vazia sem retornar erro quando não há blocos ativos', async () => {
    const resetMock = vi.fn();
    const { result } = renderHook(() => useAgendaSubmit(resetMock));

    const horarios = diasDaSemana.reduce((acc, dia) => {
      acc[dia.key] = dia.key === 'segunda'
        ? [{ ativo: false, inicio: '', fim: '', local_id: null }]
        : [];
      return acc;
    }, {} as AgendaFormData['horarios']);

    await act(async () => {
      await result.current.onSubmit({ horarios });
    });

    const expectedHorarios = diasDaSemana.reduce((acc, dia) => {
      acc[dia.key] = [];
      return acc;
    }, {} as AgendaFormData['horarios']);

    expect(mockUpdate).toHaveBeenCalledWith({
      configuracoes: expect.objectContaining({ horarioAtendimento: expectedHorarios }),
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('user_id', mockUser.id);
    expect(resetMock).toHaveBeenCalledWith({ horarios: expectedHorarios });
    expect(toastMock).toHaveBeenCalledWith({ title: 'Agenda atualizada com sucesso!' });
    expect(toastMock.mock.calls.some(([args]) => args?.variant === 'destructive')).toBe(false);
  });
});
