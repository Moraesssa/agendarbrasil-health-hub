import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  const mockMaybeSingle = vi.fn();
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle, single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const mockUpsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });

  return {
    supabase: {
      auth: {
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: mockSelect,
        update: mockUpdate,
        upsert: mockUpsert,
      })),
      __mocks: { mockMaybeSingle, mockSingle, mockEq, mockSelect, mockUpdate },
    },
  };
});

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { authService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

const mocks = (supabase as any).__mocks;

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire chainable returns after clearAllMocks
  mocks.mockSelect.mockReturnValue({ eq: mocks.mockEq });
  mocks.mockEq.mockReturnValue({ maybeSingle: mocks.mockMaybeSingle, single: mocks.mockSingle });
});

describe('authService.signInWithGoogle', () => {
  it('calls supabase signInWithOAuth with google provider', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { url: 'https://google.com', provider: 'google' },
      error: null,
    });

    const result = await authService.signInWithGoogle();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.any(String) },
    });
    expect(result.error).toBeNull();
  });

  it('returns error when sign-in fails', async () => {
    const mockError = { message: 'OAuth error', name: 'AuthError', status: 400 };
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { url: null, provider: 'google' },
      error: mockError as any,
    });

    const result = await authService.signInWithGoogle();
    expect(result.error).toBeDefined();
  });
});

describe('authService.logout', () => {
  it('calls supabase signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
    const result = await authService.logout();
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });
});

describe('authService.loadUserProfile', () => {
  it('returns profile when found', async () => {
    const mockProfile = {
      id: 'uid-123',
      email: 'test@test.com',
      user_type: 'paciente',
      onboarding_completed: true,
    };
    mocks.mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

    const result = await authService.loadUserProfile('uid-123');

    expect(result.profile).toEqual(mockProfile);
    expect(result.shouldRetry).toBe(false);
  });

  it('returns error when query fails', async () => {
    mocks.mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB error', details: '', hint: '', code: '500' },
    });

    const result = await authService.loadUserProfile('uid-123');

    expect(result.profile).toBeNull();
    expect(result.shouldRetry).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('authService.updateUserType', () => {
  it('calls supabase from profiles', async () => {
    const result = await authService.updateUserType('uid-123', 'medico');
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });
});

describe('authService.completeOnboarding', () => {
  it('calls supabase from profiles', async () => {
    const result = await authService.completeOnboarding('uid-123');
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });
});
