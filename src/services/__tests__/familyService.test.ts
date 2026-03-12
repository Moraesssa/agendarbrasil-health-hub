import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { familyService } from '@/services/familyService';

describe('familyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } } });
  });

  describe('getFamilyMembers', () => {
    it('should throw when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      await expect(familyService.getFamilyMembers()).rejects.toThrow('Usuário não autenticado');
    });

    it('should call RPC with correct user UUID', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      await familyService.getFamilyMembers();
      expect(mockRpc).toHaveBeenCalledWith('get_family_members', { user_uuid: 'user-abc' });
    });

    it('should map returned data to FamilyMember type', async () => {
      mockRpc.mockResolvedValue({
        data: [{
          id: 'fm-1',
          family_member_id: 'member-1',
          display_name: 'Ana',
          email: 'ana@test.com',
          relationship: 'spouse',
          permission_level: 'admin',
          can_schedule: true,
          can_view_history: true,
          can_cancel: false,
          status: 'active',
        }],
        error: null,
      });

      const members = await familyService.getFamilyMembers();
      expect(members).toHaveLength(1);
      expect(members[0]).toEqual({
        id: 'fm-1',
        family_member_id: 'member-1',
        display_name: 'Ana',
        email: 'ana@test.com',
        relationship: 'spouse',
        permission_level: 'admin',
        can_schedule: true,
        can_view_history: true,
        can_cancel: false,
        status: 'active',
      });
    });

    it('should return empty array when data is null', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });
      const members = await familyService.getFamilyMembers();
      expect(members).toEqual([]);
    });

    it('should throw on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });
      await expect(familyService.getFamilyMembers()).rejects.toThrow('Erro ao buscar membros da família');
    });
  });

  describe('addFamilyMember', () => {
    it('should throw when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      await expect(familyService.addFamilyMember({
        email: 'test@test.com',
        relationship: 'spouse',
        permission_level: 'admin',
        can_schedule: true,
        can_view_history: true,
        can_cancel: false,
      })).rejects.toThrow('Usuário não autenticado');
    });

    it('should throw when target user not found by email', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      await expect(familyService.addFamilyMember({
        email: 'nonexistent@test.com',
        relationship: 'child',
        permission_level: 'viewer',
        can_schedule: false,
        can_view_history: true,
        can_cancel: false,
      })).rejects.toThrow('Usuário não encontrado com este email');
    });

    it('should insert family member with correct data', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'target-user' }, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ insert: mockInsert });

      await familyService.addFamilyMember({
        email: 'member@test.com',
        relationship: 'parent',
        permission_level: 'admin',
        can_schedule: true,
        can_view_history: true,
        can_cancel: true,
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-abc',
        family_member_id: 'target-user',
        relationship: 'parent',
        permission_level: 'admin',
        can_schedule: true,
        can_view_history: true,
        can_cancel: true,
      });
    });
  });

  describe('updateFamilyMember', () => {
    it('should call update with correct params', async () => {
      const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEqUpdate });
      mockFrom.mockReturnValue({ update: mockUpdateFn });

      await familyService.updateFamilyMember('fm-1', { can_schedule: false });

      expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({
        can_schedule: false,
      }));
      expect(mockEqUpdate).toHaveBeenCalledWith('id', 'fm-1');
    });

    it('should throw on update error', async () => {
      const mockEqUpdate = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEqUpdate });
      mockFrom.mockReturnValue({ update: mockUpdateFn });

      await expect(familyService.updateFamilyMember('fm-1', {}))
        .rejects.toThrow('Erro ao atualizar membro da família');
    });
  });

  describe('removeFamilyMember', () => {
    it('should call delete with correct id', async () => {
      const mockEqDel = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDel });
      mockFrom.mockReturnValue({ delete: mockDelete });

      await familyService.removeFamilyMember('fm-99');
      expect(mockEqDel).toHaveBeenCalledWith('id', 'fm-99');
    });

    it('should throw on delete error', async () => {
      const mockEqDel = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDel });
      mockFrom.mockReturnValue({ delete: mockDelete });

      await expect(familyService.removeFamilyMember('fm-99'))
        .rejects.toThrow('Erro ao remover membro da família');
    });
  });
});
