import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

vi.mock('@/services/agendamento', () => ({
  agendamentoService: {
    buscarMedicos: vi.fn(),
    buscarHorarios: vi.fn(),
    criarConsulta: vi.fn(),
  },
}));

import { getSpecialties, getStates, getCities, appointmentService } from '@/services/appointmentService';
import { agendamentoService } from '@/services/agendamento';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSpecialties', () => {
  it('returns specialties from RPC', async () => {
    const specialties = ['Cardiologia', 'Dermatologia'];
    mockRpc.mockResolvedValue({ data: specialties, error: null });

    const result = await getSpecialties();

    expect(mockRpc).toHaveBeenCalledWith('get_specialties');
    expect(result).toEqual(specialties);
  });

  it('returns empty array when data is null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await getSpecialties();

    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });

    await expect(getSpecialties()).rejects.toThrow('RPC failed');
  });
});

describe('getStates', () => {
  it('returns states from RPC', async () => {
    const states = [{ uf: 'SP', nome: 'SP' }];
    mockRpc.mockResolvedValue({ data: states, error: null });

    const result = await getStates();

    expect(mockRpc).toHaveBeenCalledWith('get_available_states');
    expect(result).toEqual(states);
  });
});

describe('getCities', () => {
  it('passes state UF parameter', async () => {
    const cities = [{ cidade: 'São Paulo', estado: 'SP', total_medicos: 5 }];
    mockRpc.mockResolvedValue({ data: cities, error: null });

    const result = await getCities('SP');

    expect(mockRpc).toHaveBeenCalledWith('get_available_cities', { state_uf: 'SP' });
    expect(result).toEqual(cities);
  });
});

describe('appointmentService.getMedicos', () => {
  it('delegates to agendamentoService.buscarMedicos', async () => {
    const medicos = [{ id: '1', display_name: 'Dr. Test' }];
    vi.mocked(agendamentoService.buscarMedicos).mockResolvedValue(medicos as any);

    const result = await appointmentService.getMedicos('Cardiologia', 'SP', 'São Paulo');

    expect(agendamentoService.buscarMedicos).toHaveBeenCalledWith('Cardiologia', 'SP', 'São Paulo');
    expect(result).toEqual(medicos);
  });
});

describe('appointmentService.createAppointment', () => {
  it('delegates to agendamentoService.criarConsulta', async () => {
    vi.mocked(agendamentoService.criarConsulta).mockResolvedValue({ success: true } as any);

    const data = { doctor_id: '1', patient_id: '2', datetime: '2024-01-15T10:00:00Z' };
    const result = await appointmentService.createAppointment(data);

    expect(agendamentoService.criarConsulta).toHaveBeenCalledWith(data);
    expect(result).toEqual({ success: true });
  });
});
