/**
 * Motor de Eventos do Scheduler em Tempo Real
 * Gerencia eventos, dispara reotimizações e controla frequência
 */

import { 
  SchedulerEvent, 
  SchedulerState, 
  OptimizedSchedule, 
  SchedulerParams,
  SchedulerPatient 
} from '@/types/realTimeScheduler';
import { RealTimeOptimizer } from './realTimeOptimizer';

export class SchedulerEventEngine {
  private optimizer: RealTimeOptimizer;
  private params: SchedulerParams;
  private currentState: SchedulerState;
  private lastOptimization: Date;
  private optimizationCount: number = 0;
  private eventQueue: SchedulerEvent[] = [];
  private isProcessing: boolean = false;
  
  // Callbacks para notificar mudanças
  private onScheduleUpdated?: (schedule: OptimizedSchedule) => void;
  private onEventProcessed?: (event: SchedulerEvent, result: OptimizedSchedule) => void;

  constructor(
    optimizer: RealTimeOptimizer,
    params: SchedulerParams,
    initialState: SchedulerState
  ) {
    this.optimizer = optimizer;
    this.params = params;
    this.currentState = initialState;
    this.lastOptimization = new Date();
    
    // Iniciar processamento de eventos
    this.startEventProcessing();
  }

  /**
   * Registra callbacks para notificações
   */
  setCallbacks(callbacks: {
    onScheduleUpdated?: (schedule: OptimizedSchedule) => void;
    onEventProcessed?: (event: SchedulerEvent, result: OptimizedSchedule) => void;
  }) {
    this.onScheduleUpdated = callbacks.onScheduleUpdated;
    this.onEventProcessed = callbacks.onEventProcessed;
  }

  /**
   * Adiciona evento à fila de processamento
   */
  addEvent(event: SchedulerEvent): void {
    console.log(`📥 Evento recebido: ${event.type} - ${event.patient_id || 'sistema'}`);
    
    // Validar se evento deve ser processado
    if (!this.shouldProcessEvent(event)) {
      console.log(`⏭️ Evento ignorado: ${event.type}`);
      return;
    }
    
    this.eventQueue.push(event);
    
    // Processar imediatamente se for emergência
    if (event.type === 'emergency_insert') {
      this.processEventQueue();
    }
  }

  /**
   * Força reotimização manual
   */
  async forceReoptimization(): Promise<OptimizedSchedule> {
    console.log('🔄 Reotimização manual forçada');
    return await this.optimizer.reoptimize(this.currentState);
  }

  /**
   * Atualiza estado atual do sistema
   */
  updateState(newState: Partial<SchedulerState>): void {
    this.currentState = { ...this.currentState, ...newState };
    
    // Disparar reotimização se mudança significativa
    if (newState.current_consultation || newState.scheduled_queue) {
      this.addEvent({
        type: 'consultation_end',
        timestamp: new Date(),
        data: {}
      });
    }
  }

  /**
   * Simula chegada de paciente
   */
  simulatePatientArrival(patientId: string, actualArrivalTime: Date): void {
    this.addEvent({
      type: 'patient_arrival',
      timestamp: new Date(),
      patient_id: patientId,
      data: {
        actual_arrival_time: actualArrivalTime
      }
    });
  }

  /**
   * Simula atualização de trânsito
   */
  simulateTrafficUpdate(patientId: string, delayMinutes: number): void {
    this.addEvent({
      type: 'traffic_update',
      timestamp: new Date(),
      patient_id: patientId,
      data: {
        traffic_delay_minutes: delayMinutes
      }
    });
  }

  /**
   * Simula inserção de emergência
   */
  simulateEmergencyInsert(emergencyPatient: SchedulerPatient): void {
    this.addEvent({
      type: 'emergency_insert',
      timestamp: new Date(),
      data: {
        emergency_patient: emergencyPatient
      }
    });
  }

  /**
   * Simula fim de consulta
   */
  simulateConsultationEnd(patientId: string, actualDuration: number): void {
    this.addEvent({
      type: 'consultation_end',
      timestamp: new Date(),
      patient_id: patientId,
      data: {
        actual_duration: actualDuration
      }
    });
  }

  /**
   * Simula no-show de paciente
   */
  simulateNoShow(patientId: string): void {
    this.addEvent({
      type: 'no_show',
      timestamp: new Date(),
      patient_id: patientId,
      data: {
        confirmed_no_show: true
      }
    });
  }

  /**
   * Verifica se evento deve ser processado
   */
  private shouldProcessEvent(event: SchedulerEvent): boolean {
    const now = new Date();
    const timeSinceLastOptimization = (now.getTime() - this.lastOptimization.getTime()) / (1000 * 60);
    
    // Sempre processar emergências
    if (event.type === 'emergency_insert') {
      return true;
    }
    
    // Limitar frequência de reotimizações
    if (timeSinceLastOptimization < this.params.reoptimize_threshold_minutes) {
      return false;
    }
    
    // Limitar número de reotimizações por hora
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (this.lastOptimization > oneHourAgo && 
        this.optimizationCount >= this.params.max_reoptimizations_per_hour) {
      return false;
    }
    
    return true;
  }

  /**
   * Inicia processamento contínuo de eventos
   */
  private startEventProcessing(): void {
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 5000); // Verificar a cada 5 segundos
  }

  /**
   * Processa fila de eventos
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Processar eventos em lote para eficiência
      const eventsToProcess = this.eventQueue.splice(0, 5); // Máximo 5 por vez
      
      console.log(`🔄 Processando ${eventsToProcess.length} eventos`);
      
      // Aplicar eventos ao estado
      for (const event of eventsToProcess) {
        this.applyEventToState(event);
      }
      
      // Reotimizar com o último evento como trigger
      const lastEvent = eventsToProcess[eventsToProcess.length - 1];
      const optimizedSchedule = await this.optimizer.reoptimize(this.currentState, lastEvent);
      
      // Atualizar contadores
      this.lastOptimization = new Date();
      this.optimizationCount++;
      
      // Notificar callbacks
      if (this.onScheduleUpdated) {
        this.onScheduleUpdated(optimizedSchedule);
      }
      
      if (this.onEventProcessed) {
        this.onEventProcessed(lastEvent, optimizedSchedule);
      }
      
      console.log(`✅ Reotimização concluída - Custo total: ${optimizedSchedule.metrics.total_cost.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Erro no processamento de eventos:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Aplica evento ao estado atual
   */
  private applyEventToState(event: SchedulerEvent): void {
    switch (event.type) {
      case 'patient_arrival':
        // Marcar paciente como chegado
        this.currentState.scheduled_queue = this.currentState.scheduled_queue.map(patient => {
          if (patient.id === event.patient_id) {
            return {
              ...patient,
              eta_distribution: { p50: 0, p80: 0, p95: 0 } // já chegou
            };
          }
          return patient;
        });
        break;
        
      case 'consultation_end':
        // Limpar consulta atual
        this.currentState.current_consultation = undefined;
        this.currentState.current_time = new Date();
        break;
        
      case 'emergency_insert':
        // Adicionar emergência à fila
        if (event.data.emergency_patient) {
          this.currentState.scheduled_queue.unshift(event.data.emergency_patient);
        }
        break;
        
      case 'no_show':
        // Remover paciente da fila
        this.currentState.scheduled_queue = this.currentState.scheduled_queue.filter(
          patient => patient.id !== event.patient_id
        );
        break;
        
      case 'traffic_update':
        // Atualizar ETA do paciente
        if (event.data.traffic_delay_minutes) {
          this.currentState.scheduled_queue = this.currentState.scheduled_queue.map(patient => {
            if (patient.id === event.patient_id) {
              const delay = event.data.traffic_delay_minutes!;
              return {
                ...patient,
                eta_distribution: {
                  p50: patient.eta_distribution.p50 + delay,
                  p80: patient.eta_distribution.p80 + delay,
                  p95: patient.eta_distribution.p95 + delay
                }
              };
            }
            return patient;
          });
        }
        break;
    }
  }

  /**
   * Obtém estatísticas do motor de eventos
   */
  getStats() {
    return {
      events_in_queue: this.eventQueue.length,
      last_optimization: this.lastOptimization,
      optimizations_count: this.optimizationCount,
      is_processing: this.isProcessing,
      current_patients: this.currentState.scheduled_queue.length,
      current_consultation: this.currentState.current_consultation?.patient_id || null
    };
  }

  /**
   * Limpa fila de eventos (para testes)
   */
  clearEventQueue(): void {
    this.eventQueue = [];
    this.isProcessing = false;
  }

  /**
   * Para o processamento de eventos
   */
  stop(): void {
    this.clearEventQueue();
    console.log('🛑 Motor de eventos parado');
  }
}