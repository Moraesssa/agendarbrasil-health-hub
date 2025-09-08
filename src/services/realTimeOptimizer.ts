/**
 * Otimizador de Agenda em Tempo Real
 * Implementa algoritmo de best-insertion + refinamento local com horizonte recedente
 */

import { 
  SchedulerState, 
  SchedulerPatient, 
  OptimizedSchedule, 
  SchedulerParams, 
  SchedulerEvent,
  PriorityLevel 
} from '@/types/realTimeScheduler';
import { ETAPredictor, DurationPredictor, PriorityClassifier } from './schedulerPredictors';

export class RealTimeOptimizer {
  private etaPredictor: ETAPredictor;
  private durationPredictor: DurationPredictor;
  private priorityClassifier: PriorityClassifier;
  private params: SchedulerParams;

  constructor(
    etaPredictor: ETAPredictor,
    durationPredictor: DurationPredictor,
    priorityClassifier: PriorityClassifier,
    params: SchedulerParams
  ) {
    // Validações de entrada
    if (!etaPredictor) {
      throw new Error('ETAPredictor é obrigatório');
    }
    
    if (!durationPredictor) {
      throw new Error('DurationPredictor é obrigatório');
    }
    
    if (!priorityClassifier) {
      throw new Error('PriorityClassifier é obrigatório');
    }
    
    if (!params) {
      throw new Error('SchedulerParams é obrigatório');
    }
    
    this.etaPredictor = etaPredictor;
    this.durationPredictor = durationPredictor;
    this.priorityClassifier = priorityClassifier;
    this.params = params;
  }

  /**
   * Reotimiza agenda completa baseada no estado atual e evento disparador
   */
  async reoptimize(
    currentState: SchedulerState,
    triggerEvent?: SchedulerEvent
  ): Promise<OptimizedSchedule> {
    
    // Validações de entrada
    if (!currentState) {
      throw new Error('Estado atual é obrigatório');
    }
    
    if (!currentState.scheduled_queue || !Array.isArray(currentState.scheduled_queue)) {
      throw new Error('Fila de agendamentos inválida');
    }
    
    if (!currentState.doctor_config) {
      throw new Error('Configuração do médico é obrigatória');
    }
    
    // Log para desenvolvimento - remover em produção
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Reotimizando agenda - Evento: ${triggerEvent?.type || 'manual'}`);
    }
    
    // 1. Atualizar predições com dados mais recentes
    const updatedPatients = await this.updatePredictions(currentState.scheduled_queue);
    
    // 2. Aplicar evento disparador
    const adjustedPatients = this.applyTriggerEvent(updatedPatients, triggerEvent);
    
    // 3. Separar emergências e pacientes normais
    const { emergencies, normalPatients } = this.separateByPriority(adjustedPatients);
    
    // 4. Construir sequência otimizada
    let optimizedSequence = this.scheduleEmergencies(emergencies, currentState);
    optimizedSequence = this.optimizeNormalPatients(normalPatients, optimizedSequence, currentState);
    
    // 5. Refinamento local (2-opt)
    optimizedSequence = this.localRefinement(optimizedSequence, currentState);
    
    // 6. Gerar timeline detalhada
    const timeline = this.generateTimeline(optimizedSequence, currentState);
    
    // 7. Calcular métricas
    const metrics = this.calculateMetrics(timeline, currentState);
    
    // 8. Detectar mudanças
    const changes = this.detectChanges(currentState.scheduled_queue, optimizedSequence);
    
    return {
      sequence: optimizedSequence,
      timeline,
      metrics,
      changes_from_previous: changes
    };
  }

  /**
   * Atualiza predições de ETA e duração para todos os pacientes
   */
  private async updatePredictions(patients: SchedulerPatient[]): Promise<SchedulerPatient[]> {
    const updated = [];
    
    for (const patient of patients) {
      // Atualizar ETA baseado em trânsito atual
      const etaDistribution = await this.etaPredictor.predictArrivalDistribution(patient, 1.0);
      
      // Atualizar duração baseada em histórico
      const durationDistribution = this.durationPredictor.predictDurationDistribution(patient);
      
      updated.push({
        ...patient,
        eta_distribution: etaDistribution,
        duration_distribution: durationDistribution
      });
    }
    
    return updated;
  }

  /**
   * Aplica efeitos do evento disparador na lista de pacientes
   */
  private applyTriggerEvent(
    patients: SchedulerPatient[], 
    event?: SchedulerEvent
  ): SchedulerPatient[] {
    
    if (!event) return patients;
    
    switch (event.type) {
      case 'emergency_insert':
        if (event.data.emergency_patient) {
          return [event.data.emergency_patient, ...patients];
        }
        break;
        
      case 'patient_arrival':
        // Atualizar ETA do paciente que chegou
        return patients.map(p => {
          if (p.id === event.patient_id && event.data.actual_arrival_time) {
            return {
              ...p,
              eta_distribution: {
                p50: 0, p80: 0, p95: 0 // já chegou
              }
            };
          }
          return p;
        });
        
      case 'traffic_update':
        // Atualizar ETAs baseado em novo trânsito
        return patients.map(p => {
          if (p.id === event.patient_id && event.data.traffic_delay_minutes) {
            const delay = event.data.traffic_delay_minutes;
            return {
              ...p,
              eta_distribution: {
                p50: p.eta_distribution.p50 + delay,
                p80: p.eta_distribution.p80 + delay,
                p95: p.eta_distribution.p95 + delay
              }
            };
          }
          return p;
        });
        
      case 'no_show':
        // Remover paciente que não compareceu
        return patients.filter(p => p.id !== event.patient_id);
    }
    
    return patients;
  }

  /**
   * Separa pacientes por prioridade
   */
  private separateByPriority(patients: SchedulerPatient[]) {
    const emergencies = patients.filter(p => p.priority === 'emergency');
    const normalPatients = patients.filter(p => p.priority !== 'emergency');
    
    return { emergencies, normalPatients };
  }

  /**
   * Agenda emergências primeiro (preemptivo limitado)
   */
  private scheduleEmergencies(
    emergencies: SchedulerPatient[], 
    state: SchedulerState
  ): SchedulerPatient[] {
    
    // Ordenar emergências por ordem de chegada/gravidade
    const sortedEmergencies = emergencies.sort((a, b) => {
      // Priorizar quem já chegou
      const aArrived = a.eta_distribution.p50 <= 0;
      const bArrived = b.eta_distribution.p50 <= 0;
      
      if (aArrived && !bArrived) return -1;
      if (!aArrived && bArrived) return 1;
      
      // Depois por ETA
      return a.eta_distribution.p80 - b.eta_distribution.p80;
    });
    
    return sortedEmergencies;
  }

  /**
   * Otimiza pacientes normais usando best-insertion
   */
  private optimizeNormalPatients(
    normalPatients: SchedulerPatient[],
    currentSequence: SchedulerPatient[],
    state: SchedulerState
  ): SchedulerPatient[] {
    
    // Ordenar candidatos por prioridade e ETA
    const sortedCandidates = normalPatients.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.eta_distribution.p80 - b.eta_distribution.p80;
    });
    
    const sequence = [...currentSequence];
    
    // Best-insertion para cada candidato
    for (const candidate of sortedCandidates) {
      const bestPosition = this.findBestInsertionPosition(candidate, sequence, state);
      sequence.splice(bestPosition, 0, candidate);
    }
    
    return sequence;
  }

  /**
   * Encontra melhor posição para inserir paciente na sequência
   */
  private findBestInsertionPosition(
    patient: SchedulerPatient,
    sequence: SchedulerPatient[],
    state: SchedulerState
  ): number {
    
    let bestPosition = 0;
    let bestCost = Infinity;
    
    // Testar inserção em cada posição possível
    for (let pos = 0; pos <= sequence.length; pos++) {
      const testSequence = [...sequence];
      testSequence.splice(pos, 0, patient);
      
      const cost = this.calculateSequenceCost(testSequence, state);
      
      if (cost < bestCost) {
        bestCost = cost;
        bestPosition = pos;
      }
    }
    
    return bestPosition;
  }

  /**
   * Calcula custo esperado de uma sequência
   */
  private calculateSequenceCost(
    sequence: SchedulerPatient[],
    state: SchedulerState
  ): number {
    
    let currentTime = new Date(state.current_time);
    let totalCost = 0;
    let totalIdle = 0;
    
    // Se há consulta em andamento, começar do fim dela
    if (state.current_consultation) {
      currentTime = new Date(state.current_consultation.estimated_end);
    }
    
    for (const patient of sequence) {
      // Calcular ETA e duração usando quantis configurados
      const etaOffset = patient.eta_distribution.p80; // usar p80 por padrão
      const duration = patient.duration_distribution.p80;
      
      const eta = new Date(patient.scheduled_time.getTime() + etaOffset * 60 * 1000);
      const startTime = new Date(Math.max(currentTime.getTime(), eta.getTime()));
      
      // Calcular componentes do custo
      const idle = Math.max(0, (eta.getTime() - currentTime.getTime()) / (1000 * 60));
      const delay = Math.max(0, (startTime.getTime() - eta.getTime()) / (1000 * 60));
      
      // Aplicar pesos por prioridade
      const alpha = this.params.alpha_priority[patient.priority];
      
      totalCost += alpha * delay;
      totalIdle += idle;
      
      // Avançar tempo
      currentTime = new Date(startTime.getTime() + duration * 60 * 1000);
    }
    
    // Adicionar custos de ociosidade e overtime
    totalCost += this.params.beta_idle * totalIdle;
    
    const clinicEnd = state.doctor_config.clinic_end;
    const overtime = Math.max(0, (currentTime.getTime() - clinicEnd.getTime()) / (1000 * 60));
    totalCost += this.params.delta_overtime * overtime;
    
    return totalCost;
  }

  /**
   * Refinamento local usando trocas adjacentes (2-opt simplificado)
   */
  private localRefinement(
    sequence: SchedulerPatient[],
    state: SchedulerState
  ): SchedulerPatient[] {
    
    let improved = true;
    let currentSequence = [...sequence];
    let iterations = 0;
    const maxIterations = 10;
    
    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      
      // Tentar trocar pares adjacentes
      for (let i = 0; i < currentSequence.length - 1; i++) {
        // Não trocar emergências
        if (currentSequence[i].priority === 'emergency' || 
            currentSequence[i + 1].priority === 'emergency') {
          continue;
        }
        
        const originalCost = this.calculateSequenceCost(currentSequence, state);
        
        // Trocar posições
        const testSequence = [...currentSequence];
        [testSequence[i], testSequence[i + 1]] = [testSequence[i + 1], testSequence[i]];
        
        const newCost = this.calculateSequenceCost(testSequence, state);
        
        if (newCost < originalCost) {
          currentSequence = testSequence;
          improved = true;
          break; // Recomeçar do início
        }
      }
    }
    
    // Log para desenvolvimento - remover em produção
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Refinamento local: ${iterations} iterações`);
    }
    return currentSequence;
  }

  /**
   * Gera timeline detalhada com horários e buffers
   */
  private generateTimeline(
    sequence: SchedulerPatient[],
    state: SchedulerState
  ) {
    const timeline = [];
    let currentTime = new Date(state.current_time);
    
    if (state.current_consultation) {
      currentTime = new Date(state.current_consultation.estimated_end);
    }
    
    for (const patient of sequence) {
      const etaOffset = patient.eta_distribution.p80;
      const duration = patient.duration_distribution.p80;
      
      const eta = new Date(patient.scheduled_time.getTime() + etaOffset * 60 * 1000);
      const plannedStart = new Date(Math.max(currentTime.getTime(), eta.getTime()));
      
      // Calcular buffer probabilístico
      const bufferMinutes = Math.min(
        this.params.max_buffer_minutes,
        Math.max(
          this.params.min_buffer_minutes,
          (patient.duration_distribution.p95 - patient.duration_distribution.p80) * this.params.buffer_multiplier
        )
      );
      
      const plannedEnd = new Date(plannedStart.getTime() + (duration + bufferMinutes) * 60 * 1000);
      
      timeline.push({
        patient_id: patient.id,
        planned_start: plannedStart,
        planned_end: plannedEnd,
        buffer_minutes: bufferMinutes,
        confidence_level: 0.8 // p80
      });
      
      currentTime = plannedEnd;
    }
    
    return timeline;
  }

  /**
   * Calcula métricas da agenda otimizada
   */
  private calculateMetrics(timeline: Array<{
    patient_id: string;
    planned_start: Date;
    planned_end: Date;
    buffer_minutes: number;
    confidence_level: number;
  }>, state: SchedulerState) {
    const totalDelay = 0;
    let totalIdle = 0;
    const emergencySLAViolations = 0;
    
    let currentTime = new Date(state.current_time);
    if (state.current_consultation) {
      currentTime = new Date(state.current_consultation.estimated_end);
    }
    
    for (let i = 0; i < timeline.length; i++) {
      const slot = timeline[i];
      
      // Calcular ociosidade
      if (i === 0) {
        totalIdle += Math.max(0, (slot.planned_start.getTime() - currentTime.getTime()) / (1000 * 60));
      } else {
        const prevEnd = timeline[i - 1].planned_end;
        totalIdle += Math.max(0, (slot.planned_start.getTime() - prevEnd.getTime()) / (1000 * 60));
      }
      
      // Verificar SLA de emergência (placeholder - precisa do paciente)
      // emergencySLAViolations += ...
    }
    
    const clinicEnd = state.doctor_config.clinic_end;
    const lastSlot = timeline[timeline.length - 1];
    const overtime = lastSlot ? Math.max(0, (lastSlot.planned_end.getTime() - clinicEnd.getTime()) / (1000 * 60)) : 0;
    
    const totalCost = totalDelay * 1.0 + totalIdle * this.params.beta_idle + overtime * this.params.delta_overtime;
    
    return {
      expected_total_delay: totalDelay,
      expected_idle_time: totalIdle,
      expected_overtime: overtime,
      emergency_sla_compliance: 1.0 - (emergencySLAViolations / Math.max(1, timeline.length)),
      total_cost: totalCost
    };
  }

  /**
   * Detecta mudanças em relação à agenda anterior
   */
  private detectChanges(
    previousSchedule: SchedulerPatient[],
    newSequence: SchedulerPatient[]
  ) {
    const changes = [];
    
    // Mapear posições antigas
    const oldPositions = new Map();
    previousSchedule.forEach((patient, index) => {
      oldPositions.set(patient.id, index);
    });
    
    // Detectar mudanças de posição
    newSequence.forEach((patient, newIndex) => {
      const oldIndex = oldPositions.get(patient.id);
      
      if (oldIndex !== undefined && oldIndex !== newIndex) {
        changes.push({
          patient_id: patient.id,
          old_time: previousSchedule[oldIndex]?.scheduled_time,
          new_time: patient.scheduled_time,
          reason: `Reposicionado de ${oldIndex + 1}º para ${newIndex + 1}º lugar`
        });
      }
    });
    
    return changes;
  }
}