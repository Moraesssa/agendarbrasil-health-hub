import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAvailableDates, clearCache } from '../useAvailableDates';

// Mock the appointment service
vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    getAvailableDates: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking
const { appointmentService } = await import('@/services/appointmentService');
const mockGetAvailableDates = appointmentService.getAvailableDates as any;

describe('useAvailableDates', () => {

  beforeEach(() => {
    // Clear the custom cache before each test
    clearCache();
    vi.clearAllMocks();
  });

  it('should return empty array when doctorId is not provided', async () => {
    const { result } = renderHook(() => useAvailableDates(''));
    
    expect(result.current.availableDates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should fetch available dates successfully', async () => {
    const mockDates = ['2025-01-30', '2025-01-31', '2025-02-01'];
    mockGetAvailableDates.mockResolvedValue(mockDates);

    const { result } = renderHook(() => useAvailableDates('doctor-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.availableDates).toEqual(mockDates);
    });

    expect(result.current.error).toBe(null);
    expect(mockGetAvailableDates).toHaveBeenCalledWith('doctor-123', undefined, undefined);
  });

  it('should use custom date range when provided', async () => {
    const mockDates = ['2025-02-01', '2025-02-02'];
    mockGetAvailableDates.mockResolvedValue(mockDates);

    const { result } = renderHook(() => 
      useAvailableDates('doctor-123', {
        startDate: '2025-02-01',
        endDate: '2025-02-07'
      })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetAvailableDates).toHaveBeenCalledWith(
      'doctor-123',
      '2025-02-01',
      '2025-02-07'
    );
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() => 
      useAvailableDates('doctor-123', { enabled: false })
    );

    expect(result.current.availableDates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetAvailableDates).not.toHaveBeenCalled();
  });

  it('should provide clearError function', async () => {
    const { result } = renderHook(() => useAvailableDates('doctor-123'));
    
    act(() => {
        result.current.clearError();
    });

    expect(typeof result.current.clearError).toBe('function');
  });
});