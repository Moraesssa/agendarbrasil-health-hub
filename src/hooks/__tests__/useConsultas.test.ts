import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();

const buildChain = (finalData: any = [], finalError: any = null) => {
  const result = { data: finalData, error: finalError };
  mockLimit.mockResolvedValue(result);
  mockLte.mockReturnValue({ limit: mockLimit, then: (cb: any) => Promise.resolve(result).then(cb) });
  mockGte.mockReturnValue({ lte: mockLte, limit: mockLimit, order: mockOrder, then: (cb: any) => Promise.resolve(result).then(cb) });
  mockOrder.mockReturnValue({ gte: mockGte, limit: mockLimit, then: (cb: any) => Promise.resolve(result).then(cb) });
  mockEq.mockReturnValue({ order: mockOrder, gte: mockGte, limit: mockLimit, then: (cb: any) => Promise.resolve(result).then(cb) });
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, then: (cb: any) => Promise.resolve(result).then(cb) });
  return result;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
  })),
}));

import { useConsultas } from '@/hooks/useConsultas';

describe('useConsultas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching consultations', () => {
    it('should return empty array when no user is logged in', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      (useAuth as any).mockReturnValue({ user: null });

      const { result } = renderHook(() => useConsultas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.consultas).toEqual([]);
    });

    it('should fetch and map consultation data correctly', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });

      const mockConsultas = [
        {
          id: 1,
          consultation_date: '2026-04-01T10:00:00Z',
          consultation_type: 'Online',
          status: 'agendada',
          medico_id: 'doc-1',
          paciente_id: 'user-123',
          medico: { display_name: 'Dr. Silva' },
        },
        {
          id: 2,
          consultation_date: '2026-04-02T14:00:00Z',
          consultation_type: 'Presencial',
          status: 'confirmada',
          medico_id: 'doc-2',
          paciente_id: 'user-123',
          notes: 'Clínica Central',
          medico: { display_name: 'Dra. Santos' },
        },
      ];

      buildChain(mockConsultas);

      const { result } = renderHook(() => useConsultas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.consultas).toHaveLength(2);
      expect(result.current.consultas[0].doctor_profile?.display_name).toBe('Dr. Silva');
      expect(result.current.consultas[0].local_consulta).toBe('Teleconsulta');
      expect(result.current.consultas[1].local_consulta).toBe('Clínica Central');
    });

    it('should map doctor_profile to default when medico is null', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });

      buildChain([{
        id: 1,
        consultation_date: '2026-04-01T10:00:00Z',
        consultation_type: 'Presencial',
        status: 'agendada',
        medico_id: 'doc-1',
        paciente_id: 'user-123',
        medico: null,
      }]);

      const { result } = renderHook(() => useConsultas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.consultas[0].doctor_profile?.display_name).toBe('Médico');
    });

    it('should handle fetch errors gracefully', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });

      buildChain(null, { message: 'Database error' });

      const { result } = renderHook(() => useConsultas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.consultas).toEqual([]);
    });
  });

  describe('local_consulta mapping', () => {
    it('should set "Teleconsulta" for Online type', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });

      buildChain([{
        id: 1,
        consultation_date: '2026-04-01T10:00:00Z',
        consultation_type: 'Online',
        status: 'agendada',
        medico_id: 'doc-1',
        paciente_id: 'user-123',
        medico: { display_name: 'Dr. Test' },
      }]);

      const { result } = renderHook(() => useConsultas());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.consultas[0].local_consulta).toBe('Teleconsulta');
    });

    it('should use notes for non-Online type, fallback to "Consultório médico"', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });

      buildChain([{
        id: 1,
        consultation_date: '2026-04-01T10:00:00Z',
        consultation_type: 'Presencial',
        status: 'agendada',
        medico_id: 'doc-1',
        paciente_id: 'user-123',
        notes: null,
        medico: { display_name: 'Dr. Test' },
      }]);

      const { result } = renderHook(() => useConsultas());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.consultas[0].local_consulta).toBe('Consultório médico');
    });
  });
});
