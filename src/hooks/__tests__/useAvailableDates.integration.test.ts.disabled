import { renderHook, waitFor } from '@testing-library/react';
import { useAvailableDates } from '../useAvailableDates';

// This is an integration test that tests the hook with the actual service
// It should be run with a real database connection in a test environment

describe('useAvailableDates Integration', () => {
  // Skip these tests in CI/CD or when no database is available
  const skipIntegrationTests = !process.env.SUPABASE_URL || process.env.NODE_ENV === 'test';

  it.skipIf(skipIntegrationTests)('should handle real API calls gracefully', async () => {
    const { result } = renderHook(() => useAvailableDates('non-existent-doctor'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    // Should handle non-existent doctor gracefully
    expect(result.current.availableDates).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('should provide all required interface methods', () => {
    const { result } = renderHook(() => useAvailableDates('test-doctor'));

    expect(result.current).toHaveProperty('availableDates');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refetch');
    expect(result.current).toHaveProperty('clearError');

    expect(Array.isArray(result.current.availableDates)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });
});