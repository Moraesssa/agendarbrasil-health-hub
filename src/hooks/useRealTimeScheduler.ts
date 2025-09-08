/**
 * Hook para usar o Real-Time Scheduler
 * Interface React para o algoritmo revolucionário
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  realTimeScheduler,
  RealTimeSchedulerService 
} from '@/services/realTimeSchedulerService';
import { 
  OptimizedSchedule, 
  SchedulerPatient, 
  SchedulerEvent,
  SimulationResult 
} from '@/types/realTimeScheduler';

interface UseRealTimeSchedulerReturn {
  // Estado
  isInitialized: boolean;
  isLoading: boolean;
  currentSchedule: OptimizedSchedule | null;
  lastSimulation: SimulationResult | null;
  recentEvents: SchedulerEvent[];
  systemStats: any;
  error: string | null;

  // Ações
  initialize: () => Promise<void>;
  optimizeSchedule: (doctorId: string, patients: SchedulerPatient[]) => Promise<OptimizedSchedule | null>;
  simulatePatientArrival: (patientId: string) => void;
  simulateTrafficUpdate: (patientId: string, delayMinutes: number) => void;
  simulateEmergency: (emergencyPatient: SchedulerPatient) => void;
  simulateNoShow: (patientId: string) => void;
  runSimulation: (scenarios?: number) => Promise<SimulationResult | null>;
  forceReoptimization: () => Promise<OptimizedSchedule | null>;
  clearError: () => void;

  // Utilitários
  createSamplePatient: (
    id: string, 
    priority?: 'emergency' | 'high' | 'normal' | 'low',
    scheduledTime?: Date,
    reason?: string
  ) => SchedulerPatient;
}

export const useRealTimeScheduler = (): UseRealTimeSchedulerReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<OptimizedSchedule | null>(null);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(null);
  const [recentEvents, setRecentEvents] = useState<SchedulerEvent[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Inicializar o scheduler
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Configurar callbacks
      realTimeScheduler.setCallbacks({
        onScheduleUpdated: (schedule) => {
          setCurrentSchedule(schedule);
        },
        onEventProcessed: (event, result) => {
          setRecentEvents(prev => [event, ...prev.slice(0, 9)]); // Manter últimos 10
          setCurrentSchedule(result);
        },
        onError: (err) => {
          setError(err.message);
        }
      });

      // Inicializar com dados mock
      await realTimeScheduler.initialize();
      setIsInitialized(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na inicialização do scheduler:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Otimizar agenda
  const optimizeSchedule = useCallback(async (
    doctorId: string, 
    patients: SchedulerPatient[]
  ): Promise<OptimizedSchedule | null> => {
    if (!isInitialized) {
      setError('Scheduler não inicializado');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await realTimeScheduler.optimizeSchedule(doctorId, patients);
      setCurrentSchedule(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na otimização';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Simular chegada de paciente
  const simulatePatientArrival = useCallback((patientId: string) => {
    if (!isInitialized) {
      setError('Scheduler não inicializado');
      return;
    }

    try {
      realTimeScheduler.handlePatientArrival(patientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao simular chegada';
      setError(errorMessage);
    }
  }, [isInitialized]);

  // Simular atualização de trânsito
  const simulateTrafficUpdate = useCallback((patientId: string, delayMinutes: number) => {
    if (!isInitialized) {
      setError('Scheduler não inicializado');
      return;
    }

    try {
      realTimeScheduler.handleTrafficUpdate(patientId, delayMinutes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao simular trânsito';
      setError(errorMessage);
    }
  }, [isInitialized]);

  // Simular emergência
  const simulateEmergency = useCallback((emergencyPatient: SchedulerPatient) => {
    if (!isInitialized) {
      setError('Scheduler não inicializado');
      return;
    }

    try {
      realTimeScheduler.handleEmergencyInsert(emergencyPatient);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao simular emergência';
      setError(errorMessage);
    }
  }, [isInitialized]);

  // Simular no-show
  const simulateNoShow = useCallback((patientId: string) => {
    if (!isInitialized) {
      setError('Scheduler não inicializado');
      return;
    }

    try {
      realTimeScheduler.handleNoShow(patientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao simular no-show';
      setError(errorMessage);
    }
  }, [isInitialized]);

  // Executar simulação Monte Carlo
  const runSimulation = useCallback(async (scenarios: number = 1000): Promise<SimulationResult | null> => {
    if (!isInitialized || !currentSchedule) {
      setError('Scheduler não inicializado ou sem agenda');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Estado mock para simulação
      const state = {
        current_time: new Date(),
        doctor_id: 'dr1',
        scheduled_queue: currentSchedule.sequence,
        waiting_queue: [],
        doctor_config: {
          clinic_start: new Date(),
          clinic_end: new Date(Date.now() + 9 * 60 * 60 * 1000),
          break_times: [],
          emergency_buffer_minutes: 15,
          max_overtime_minutes: 60
        }
      };

      const result = await realTimeScheduler.runSimulation(currentSchedule, state, scenarios);
      setLastSimulation(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na simulação';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, currentSchedule]);

  // Forçar reotimização
  const forceReoptimization = useCallback(async (): Promise<OptimizedSchedule | null> => {
    if (!isInitialized) {
      setError('Scheduler não inicializado');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await realTimeScheduler.forceReoptimization();
      setCurrentSchedule(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na reotimização';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Criar paciente de exemplo
  const createSamplePatient = useCallback((
    id: string,
    priority: 'emergency' | 'high' | 'normal' | 'low' = 'normal',
    scheduledTime: Date = new Date(),
    reason: string = 'consult'
  ): SchedulerPatient => {
    return RealTimeSchedulerService.createSamplePatient(id, priority, scheduledTime, reason);
  }, []);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    if (!isInitialized) return;

    const updateStats = () => {
      try {
        const stats = realTimeScheduler.getSystemStats();
        setSystemStats(stats);
      } catch (err) {
        console.warn('Erro ao obter estatísticas:', err);
      }
    };

    // Atualizar imediatamente
    updateStats();

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      try {
        realTimeScheduler.stop();
      } catch (err) {
        console.warn('Erro ao parar scheduler:', err);
      }
    };
  }, []);

  return {
    // Estado
    isInitialized,
    isLoading,
    currentSchedule,
    lastSimulation,
    recentEvents,
    systemStats,
    error,

    // Ações
    initialize,
    optimizeSchedule,
    simulatePatientArrival,
    simulateTrafficUpdate,
    simulateEmergency,
    simulateNoShow,
    runSimulation,
    forceReoptimization,
    clearError,

    // Utilitários
    createSamplePatient
  };
};