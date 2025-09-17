import { act, renderHook, waitFor } from '@testing-library/react';

import { useAgendaManagement } from '@/hooks/useAgendaManagement';
import { AgendaFormData, diasDaSemana } from '@/types/agenda';

const mockFetchInitialData = vi.fn();
const mockOnSubmit = vi.fn();

vi.mock('@/hooks/agenda/useAgendaData', () => ({
  useAgendaData: () => ({
    loading: false,
    locais: [],
    error: null,
    fetchInitialData: mockFetchInitialData,
  }),
}));

vi.mock('@/hooks/agenda/useAgendaSubmit', () => ({
  useAgendaSubmit: () => ({
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  }),
}));

describe('useAgendaManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite salvar uma agenda limpa quando o formulário está sujo', async () => {
    const { result } = renderHook(() => useAgendaManagement());

    const initialHorarios = diasDaSemana.reduce((acc, dia) => {
      acc[dia.key] = dia.key === 'segunda'
        ? [{ ativo: true, inicio: '08:00', fim: '12:00', local_id: '1' }]
        : [];
      return acc;
    }, {} as AgendaFormData['horarios']);

    await act(async () => {
      result.current.form.reset({ horarios: initialHorarios });
    });

    await act(async () => {
      result.current.form.setValue('horarios.segunda', [], { shouldDirty: true });
    });

    await waitFor(() => {
      expect(result.current.isDirty).toBe(true);
      expect(result.current.canSave).toBe(true);
    });
  });
});
