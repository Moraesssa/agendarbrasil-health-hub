import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          maybeSingle: mockMaybeSingle,
          single: mockSingle,
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({
          select: mockSelect,
        }),
      }),
      upsert: mockUpsert.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { authService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.signInWithGoogle', () => {
  it('calls supabase signInWithOAuth with google provider', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: { url: 'https://google.com', provider: 'google' }, error: null });

    const result = await authService.signInWithGoogle();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.any(String) },
    });
    expect(result.error).toBeNull();
  });

  it('returns error when sign-in fails', async () => {
    const mockError = { message: 'OAuth error', name: 'AuthError', status: 400 };
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: { url: null, provider: 'google' }, error: mockError as any });

    const result = await authService.signInWithGoogle();

    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('OAuth error');
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
    mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null });

    const result = await authService.loadUserProfile('uid-123');

    expect(result.profile).toEqual(mockProfile);
    expect(result.shouldRetry).toBe(false);
  });

  it('returns shouldRetry when profile not found and creation fails', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    // Mock createUserProfile to fail
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' } as any,
    });

    const result = await authService.loadUserProfile('uid-123');

    expect(result.profile).toBeNull();
  });

  it('returns error when query fails', async () => {
    const dbError = { message: 'DB error', details: '', hint: '', code: '500' };
    mockMaybeSingle.mockResolvedValue({ data: null, error: dbError });

    const result = await authService.loadUserProfile('uid-123');

    expect(result.profile).toBeNull();
    expect(result.shouldRetry).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('authService.updateUserType', () => {
  it('updates user type in profiles table', async () => {
    mockEq.mockResolvedValue({ error: null });

    const result = await authService.updateUserType('uid-123', 'medico');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(result.error).toBeUndefined();
  });
});

describe('authService.completeOnboarding', () => {
  it('sets onboarding_completed to true', async () => {
    mockEq.mockResolvedValue({ error: null });

    const result = await authService.completeOnboarding('uid-123');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(result.error).toBeUndefined();
  });
});
