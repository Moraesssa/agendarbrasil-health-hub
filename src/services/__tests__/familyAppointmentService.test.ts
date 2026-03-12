import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { familyAppointmentService } from '@/services/familyAppointmentService';

describe('familyAppointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduleFamilyAppointment', () => {
    const baseData = {
      paciente_id: 'patient-1',
      medico_id: 'doctor-1',
      consultation_date: '2026-04-01T10:00:00Z',
      consultation_type: 'Presencial',
      scheduled_by: 'user-1',
    };

    it('should throw when user has no permission to schedule', async () => {
      // family_members query returns null (no permission)
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockStatusEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockCanScheduleEq = vi.fn().mockReturnValue({ eq: mockStatusEq });
      const mockFamilyMemberEq = vi.fn().mockReturnValue({ eq: mockCanScheduleEq });
      const mockUserEq = vi.fn().mockReturnValue({ eq: mockFamilyMemberEq });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockUserEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      await expect(familyAppointmentService.scheduleFamilyAppointment(baseData))
        .rejects.toThrow('Você não tem permissão para agendar consultas para este familiar');
    });

    it('should throw when RPC reservation fails', async () => {
      // Permission check passes
      const mockSingle1 = vi.fn().mockResolvedValue({ data: { id: 'fm-1' }, error: null });
      const mockStatusEq = vi.fn().mockReturnValue({ single: mockSingle1 });
      const mockCanScheduleEq = vi.fn().mockReturnValue({ eq: mockStatusEq });
      const mockFamilyMemberEq = vi.fn().mockReturnValue({ eq: mockCanScheduleEq });
      const mockUserEq = vi.fn().mockReturnValue({ eq: mockFamilyMemberEq });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockUserEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      // RPC fails
      const mockRpcSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } });
      mockRpc.mockReturnValue({ single: mockRpcSingle });

      await expect(familyAppointmentService.scheduleFamilyAppointment(baseData))
        .rejects.toBeTruthy();
    });

    it('should throw when RPC returns success=false', async () => {
      const mockSingle1 = vi.fn().mockResolvedValue({ data: { id: 'fm-1' }, error: null });
      const mockStatusEq = vi.fn().mockReturnValue({ single: mockSingle1 });
      const mockCanScheduleEq = vi.fn().mockReturnValue({ eq: mockStatusEq });
      const mockFamilyMemberEq = vi.fn().mockReturnValue({ eq: mockCanScheduleEq });
      const mockUserEq = vi.fn().mockReturnValue({ eq: mockFamilyMemberEq });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockUserEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const mockRpcSingle = vi.fn().mockResolvedValue({
        data: { success: false, message: 'Horário indisponível' },
        error: null,
      });
      mockRpc.mockReturnValue({ single: mockRpcSingle });

      await expect(familyAppointmentService.scheduleFamilyAppointment(baseData))
        .rejects.toThrow('Horário indisponível');
    });
  });

  describe('getFamilyAppointments', () => {
    it('should return empty array when no family members found', async () => {
      const mockStatusEq = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockCanViewEq = vi.fn().mockReturnValue({ eq: mockStatusEq });
      const mockUserEq = vi.fn().mockReturnValue({ eq: mockCanViewEq });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockUserEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await familyAppointmentService.getFamilyAppointments('user-1');
      expect(result).toEqual([]);
    });

    it('should return empty array when family members is null', async () => {
      const mockStatusEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockCanViewEq = vi.fn().mockReturnValue({ eq: mockStatusEq });
      const mockUserEq = vi.fn().mockReturnValue({ eq: mockCanViewEq });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockUserEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await familyAppointmentService.getFamilyAppointments('user-1');
      expect(result).toEqual([]);
    });
  });
});
