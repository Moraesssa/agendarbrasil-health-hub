/**
 * Serviço Principal do Scheduler em Tempo Real
 * Interface unificada para o algoritmo revolucionário de otimização
 */

import { 
  SchedulerState, 
  SchedulerPatient, 
  OptimizedSchedule, 
  SchedulerParams,
  SchedulerEvent,
  HistoricalData,
  SimulationResult
} from '@/types/realTimeScheduler';

import { PredictorFactory } from './schedulerPredictors';
import { RealTimeOptimizer } from './realTimeOptimizer';
import { SchedulerEventEngine } from './schedulerEventEngine';
import { SchedulerSimulator } from './schedulerSimulator';

export class RealTimeSchedulerService {
  private optimizer: RealTimeOptimizer;
  private eventEngine: SchedulerEventEngine;
  private simulator: SchedulerSimulator;
  private params: SchedulerParams;
  private isInitialized: boolean = false;

  // Callbacks para UI
  private onScheduleUpdated?: (schedule: OptimizedSchedule) => void;
  private onEventProcessed?: (event: SchedulerEvent, result: OptimizedSchedule) => void;
  private onError?: (error: Error) => void;

  constructor() {
    // Parâmetros padrão otimizados
    this.params = this.getDefaultParams();
  }

  /**
   * Inicializa o serviço com dados históricos
   */
  async initialize(historicalData?: HistoricalData): Promise<void> {
    try {
      console.log('🚀 Inicializando Real-Time Scheduler Service...');

      // Usar dados históricos ou gerar mock
      const data = historicalData || PredictorFactory.createMockHistoricalData();
      
      // Criar preditores
      const predictors = PredictorFactory.createPredictors(data);
      
      // Criar otimizador
      this.optimizer = new RealTimeOptimizer(
        predictors.etaPredictor,
        predictors.durationPredictor,
        predictors.priorityClassifier,
        this.params
      );

      // Criar simulador
      this.simulator = new SchedulerSimulator(this.optimizer, this.params);

      // Estado inicial vazio
      const initialState = this.createInitialState();
      
      // Criar motor de eventos
      this.eventEngine = new SchedulerEventEngine(
        this.optimizer,
        this.params,
        initialState
      );

      // Configurar callbacks
      this.eventEngine.setCallbacks({
        onScheduleUpdated: (schedule) => {
          if (this.onScheduleUpdated) {
            this.onScheduleUpdated(schedule);
          }
        },
        onEventProcessed: (event, result) => {
          if (this.onEventProcessed) {
            this.onEventProcessed(event, result);
          }
        }
      });

      this.isInitialized = true;
      console.log('✅ Real-Time Scheduler inicializado com sucesso');

    } catch (error) {
      console.error('❌ Erro na inicialização do scheduler:', error);
      if (this.onError) {
        this.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Configura callbacks para notificações
   */
  setCallbacks(callbacks: {
    onScheduleUpdated?: (schedule: OptimizedSchedule) => void;
    onEventProcessed?: (event: SchedulerEvent, result: OptimizedSchedule) => void;
    onError?: (error: Error) => void;
  }): void {
    this.onScheduleUpdated = callbacks.onScheduleUpdated;
    this.onEventProcessed = callbacks.onEventProcessed;
    this.onError = callbacks.onError;
  }

  /**
   * Otimiza agenda completa para um médico
   */
  async optimizeSchedule(
    doctorId: string,
    patients: SchedulerPatient[],
    currentTime: Date = new Date()
  ): Promise<OptimizedSchedule> {
    
    this.ensureInitialized();

    console.log(`🎯 Otimizando agenda para Dr. ${doctorId} - ${patients.length} pacientes`);

    // Criar estado atual
    const state: SchedulerState = {
      current_time: currentTime,
      doctor_id: doctorId,
      scheduled_queue: patients,
      waiting_queue: [],
      doctor_config: {
        clinic_start: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 8, 0),
        clinic_end: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 17, 0),
        break_times: [
          {
            start: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 12, 0),
            end: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 13, 0)
          }
        ],
        emergency_buffer_minutes: 15,
        max_overtime_minutes: 60
      }
    };

    // Atualizar estado no motor de eventos
    this.eventEngine.updateState(state);

    // Executar otimização
    const result = await this.optimizer.reoptimize(state);

    console.log(`✅ Otimização concluída - Custo: ${result.metrics.total_cost.toFixed(2)}`);
    
    return result;
  }

  /**
   * Simula chegada de paciente
   */
  handlePatientArrival(patientId: string, actualArrivalTime: Date = new Date()): void {
    this.ensureInitialized();
    this.eventEngine.simulatePatientArrival(patientId, actualArrivalTime);
  }

  /**
   * Simula atualização de trânsito
   */
  handleTrafficUpdate(patientId: string, delayMinutes: number): void {
    this.ensureInitialized();
    this.eventEngine.simulateTrafficUpdate(patientId, delayMinutes);
  }

  /**
   * Insere emergência na agenda
   */
  handleEmergencyInsert(emergencyPatient: SchedulerPatient): void {
    this.ensureInitialized();
    this.eventEngine.simulateEmergencyInsert(emergencyPatient);
  }

  /**
   * Registra fim de consulta
   */
  handleConsultationEnd(patientId: string, actualDuration: number): void {
    this.ensureInitialized();
    this.eventEngine.simulateConsultationEnd(patientId, actualDuration);
  }

  /**
   * Registra no-show de paciente
   */
  handleNoShow(patientId: string): void {
    this.ensureInitialized();
    this.eventEngine.simulateNoShow(patientId);
  }

  /**
   * Força reotimização manual
   */
  async forceReoptimization(): Promise<OptimizedSchedule> {
    this.ensureInitialized();
    return await this.eventEngine.forceReoptimization();
  }

  /**
   * Executa simulação Monte Carlo
   */
  async runSimulation(
    schedule: OptimizedSchedule,
    state: SchedulerState,
    scenarios: number = 1000
  ): Promise<SimulationResult> {
    this.ensureInitialized();
    return await this.simulator.runMonteCarloSimulation(schedule, state, scenarios);
  }

  /**
   * Otimiza parâmetros do algoritmo
   */
  async optimizeParameters(
    sampleState: SchedulerState,
    testScenarios: number = 100
  ): Promise<{
    bestParams: SchedulerParams,
    bestScore: number,
    results: Array<{params: Partial<SchedulerParams>, score: number}>
  }> {
    this.ensureInitialized();
    return await this.simulator.optimizeParameters(sampleState, testScenarios);
  }

  /**
   * Obtém estatísticas do sistema
   */
  getSystemStats() {
    this.ensureInitialized();
    return {
      scheduler: {
        initialized: this.isInitialized,
        params: this.params
      },
      events: this.eventEngine.getStats()
    };
  }

  /**
   * Atualiza parâmetros do algoritmo
   */
  updateParameters(newParams: Partial<SchedulerParams>): void {
    this.params = { ...this.params, ...newParams };
    console.log('🔧 Parâmetros atualizados:', newParams);
  }

  /**
   * Para o serviço
   */
  stop(): void {
    if (this.eventEngine) {
      this.eventEngine.stop();
    }
    this.isInitialized = false;
    console.log('🛑 Real-Time Scheduler Service parado');
  }

  /**
   * Cria estado inicial padrão
   */
  private createInitialState(): SchedulerState {
    const now = new Date();
    
    return {
      current_time: now,
      doctor_id: '',
      scheduled_queue: [],
      waiting_queue: [],
      doctor_config: {
        clinic_start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
        clinic_end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0),
        break_times: [],
        emergency_buffer_minutes: 15,
        max_overtime_minutes: 60
      }
    };
  }

  /**
   * Parâmetros padrão otimizados
   */
  private getDefaultParams(): SchedulerParams {
    return {
      // Pesos da função de custo
      alpha_priority: {
        emergency: 10.0,  // Emergências têm peso muito alto
        high: 3.0,        // Alta prioridade
        normal: 1.0,      // Prioridade normal (baseline)
        low: 0.5          // Baixa prioridade
      },
      beta_idle: 0.1,           // Custo de ociosidade (baixo)
      delta_overtime: 2.0,      // Custo de overtime (alto)
      gamma_reschedule: 0.5,    // Custo de remarcação
      
      // Quantis para predições (conservador)
      eta_quantile: 0.8,        // p80 para ETA
      duration_quantile: 0.8,   // p80 para duração
      
      // Limites operacionais
      max_reschedules_per_patient_per_day: 2,
      min_minutes_before_reschedule: 15,    // Janela quieta
      emergency_sla_minutes: 15,            // SLA de emergência
      
      // Buffers probabilísticos
      buffer_multiplier: 1.0,
      min_buffer_minutes: 5,
      max_buffer_minutes: 20,
      
      // Controle de reotimização
      reoptimize_threshold_minutes: 5,      // Mínimo entre reotimizações
      max_reoptimizations_per_hour: 12      // Máximo por hora
    };
  }

  /**
   * Verifica se o serviço foi inicializado
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('RealTimeSchedulerService não foi inicializado. Chame initialize() primeiro.');
    }
  }

  /**
   * Cria paciente de exemplo para testes
   */
  static createSamplePatient(
    id: string,
    priority: 'emergency' | 'high' | 'normal' | 'low' = 'normal',
    scheduledTime: Date = new Date(),
    reason: string = 'consult'
  ): SchedulerPatient {
    
    return {
      id,
      priority,
      reason,
      doctor_id: 'dr1',
      scheduled_time: scheduledTime,
      distance_km: Math.random() * 10 + 2,
      eta_distribution: { p50: 5, p80: 12, p95: 20 },
      duration_distribution: { p50: 25, p80: 35, p95: 50 },
      no_show_probability: 0.05,
      punctuality_score: 0.8,
      current_reschedules: 0
    };
  }
}

// Instância singleton para uso global
export const realTimeScheduler = new RealTimeSchedulerService();