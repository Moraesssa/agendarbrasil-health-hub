/**
 * Simulador Monte Carlo para Validação do Scheduler
 * Testa políticas sob incerteza e calibra parâmetros
 */

import { 
  SchedulerState, 
  SchedulerPatient, 
  OptimizedSchedule, 
  SimulationResult,
  SchedulerParams 
} from '@/types/realTimeScheduler';
import { RealTimeOptimizer } from './realTimeOptimizer';

export class SchedulerSimulator {
  private optimizer: RealTimeOptimizer;
  private params: SchedulerParams;

  constructor(optimizer: RealTimeOptimizer, params: SchedulerParams) {
    this.optimizer = optimizer;
    this.params = params;
  }

  /**
   * Executa simulação Monte Carlo para validar agenda
   */
  async runMonteCarloSimulation(
    baseSchedule: OptimizedSchedule,
    state: SchedulerState,
    scenarios: number = 1000
  ): Promise<SimulationResult> {
    
    console.log(`🎲 Iniciando simulação Monte Carlo com ${scenarios} cenários`);
    
    const results = {
      delays: [] as number[],
      idleTimes: [] as number[],
      overtimes: [] as number[],
      emergencySLAViolations: [] as number[]
    };

    for (let i = 0; i < scenarios; i++) {
      const scenario = this.generateScenario(baseSchedule, state);
      const metrics = this.simulateScenario(scenario, state);
      
      results.delays.push(metrics.totalDelay);
      results.idleTimes.push(metrics.idleTime);
      results.overtimes.push(metrics.overtime);
      results.emergencySLAViolations.push(metrics.emergencyViolations);
    }

    // Calcular estatísticas
    const avgDelay = this.average(results.delays);
    const p95Delay = this.percentile(results.delays, 0.95);
    const avgIdle = this.average(results.idleTimes);
    const overtimeProb = results.overtimes.filter(ot => ot > 0).length / scenarios;
    const avgEmergencyViolations = this.average(results.emergencySLAViolations);

    // Análise de risco
    const riskAssessment = this.analyzeRisk(baseSchedule, results, state);

    console.log(`✅ Simulação concluída - Atraso médio: ${avgDelay.toFixed(1)}min, P95: ${p95Delay.toFixed(1)}min`);

    return {
      scenarios_run: scenarios,
      metrics: {
        avg_delay_minutes: avgDelay,
        p95_delay_minutes: p95Delay,
        avg_idle_time: avgIdle,
        overtime_probability: overtimeProb,
        emergency_sla_violations: avgEmergencyViolations
      },
      risk_assessment: riskAssessment
    };
  }

  /**
   * Gera cenário aleatório baseado nas distribuições
   */
  private generateScenario(
    baseSchedule: OptimizedSchedule, 
    state: SchedulerState
  ): Array<{patient: SchedulerPatient, actualETA: number, actualDuration: number}> {
    
    return baseSchedule.sequence.map(patient => {
      // Simular ETA real baseado na distribuição
      const etaActual = this.sampleFromDistribution(patient.eta_distribution);
      
      // Simular duração real baseada na distribuição
      const durationActual = this.sampleFromDistribution(patient.duration_distribution);
      
      // Simular no-show
      const isNoShow = Math.random() < patient.no_show_probability;
      
      return {
        patient,
        actualETA: isNoShow ? Infinity : etaActual,
        actualDuration: isNoShow ? 0 : durationActual
      };
    });
  }

  /**
   * Simula execução de um cenário específico
   */
  private simulateScenario(
    scenario: Array<{patient: SchedulerPatient, actualETA: number, actualDuration: number}>,
    state: SchedulerState
  ) {
    let currentTime = new Date(state.current_time);
    let totalDelay = 0;
    let idleTime = 0;
    let emergencyViolations = 0;

    if (state.current_consultation) {
      currentTime = new Date(state.current_consultation.estimated_end);
    }

    for (const { patient, actualETA, actualDuration } of scenario) {
      // Pular no-shows
      if (actualETA === Infinity) continue;

      // Calcular chegada real
      const actualArrival = new Date(
        patient.scheduled_time.getTime() + actualETA * 60 * 1000
      );

      // Determinar início da consulta
      const consultationStart = new Date(Math.max(
        currentTime.getTime(),
        actualArrival.getTime()
      ));

      // Calcular métricas
      const patientDelay = Math.max(0, 
        (consultationStart.getTime() - actualArrival.getTime()) / (1000 * 60)
      );
      
      const doctorIdle = Math.max(0,
        (actualArrival.getTime() - currentTime.getTime()) / (1000 * 60)
      );

      totalDelay += patientDelay;
      idleTime += doctorIdle;

      // Verificar SLA de emergência
      if (patient.priority === 'emergency') {
        const waitTime = (consultationStart.getTime() - actualArrival.getTime()) / (1000 * 60);
        if (waitTime > this.params.emergency_sla_minutes) {
          emergencyViolations++;
        }
      }

      // Avançar tempo
      currentTime = new Date(consultationStart.getTime() + actualDuration * 60 * 1000);
    }

    // Calcular overtime
    const clinicEnd = state.doctor_config.clinic_end;
    const overtime = Math.max(0, 
      (currentTime.getTime() - clinicEnd.getTime()) / (1000 * 60)
    );

    return {
      totalDelay,
      idleTime,
      overtime,
      emergencyViolations
    };
  }

  /**
   * Amostra valor de uma distribuição quantílica
   */
  private sampleFromDistribution(distribution: {p50: number, p80: number, p95: number}): number {
    const rand = Math.random();
    
    // Aproximação linear entre quantis
    if (rand <= 0.5) {
      // Entre p0 e p50
      const p0 = Math.max(0, distribution.p50 - (distribution.p80 - distribution.p50));
      return p0 + (distribution.p50 - p0) * (rand / 0.5);
    } else if (rand <= 0.8) {
      // Entre p50 e p80
      return distribution.p50 + (distribution.p80 - distribution.p50) * ((rand - 0.5) / 0.3);
    } else if (rand <= 0.95) {
      // Entre p80 e p95
      return distribution.p80 + (distribution.p95 - distribution.p80) * ((rand - 0.8) / 0.15);
    } else {
      // Cauda superior (p95+)
      const tail = distribution.p95 + (distribution.p95 - distribution.p80) * ((rand - 0.95) / 0.05);
      return tail;
    }
  }

  /**
   * Analisa riscos da agenda
   */
  private analyzeRisk(
    schedule: OptimizedSchedule,
    results: any,
    state: SchedulerState
  ) {
    const highRiskPeriods = [];
    const bottleneckPatients = [];
    const recommendations = [];

    // Identificar períodos de alto risco
    for (let i = 0; i < schedule.timeline.length - 1; i++) {
      const current = schedule.timeline[i];
      const next = schedule.timeline[i + 1];
      
      const gap = (next.planned_start.getTime() - current.planned_end.getTime()) / (1000 * 60);
      
      if (gap < 5) { // Menos de 5 min entre consultas
        highRiskPeriods.push({
          start: current.planned_start,
          end: next.planned_end,
          risk_factor: 0.8
        });
      }
    }

    // Identificar pacientes gargalo
    schedule.sequence.forEach(patient => {
      const highVariability = patient.duration_distribution.p95 - patient.duration_distribution.p50;
      if (highVariability > 20) { // Mais de 20 min de variabilidade
        bottleneckPatients.push(patient.id);
      }
    });

    // Gerar recomendações
    const avgOvertime = this.average(results.overtimes);
    if (avgOvertime > 30) {
      recommendations.push("Considerar reduzir número de consultas ou aumentar buffers");
    }

    const overtimeProb = results.overtimes.filter((ot: number) => ot > 0).length / results.overtimes.length;
    if (overtimeProb > 0.2) {
      recommendations.push("Alta probabilidade de overtime - revisar agenda");
    }

    if (highRiskPeriods.length > 3) {
      recommendations.push("Muitos períodos de risco - adicionar buffers entre consultas");
    }

    return {
      high_risk_periods: highRiskPeriods,
      bottleneck_patients: bottleneckPatients,
      recommended_actions: recommendations
    };
  }

  /**
   * Utilitários estatísticos
   */
  private average(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Testa diferentes configurações de parâmetros
   */
  async optimizeParameters(
    baseState: SchedulerState,
    testScenarios: number = 100
  ): Promise<{
    bestParams: SchedulerParams,
    bestScore: number,
    results: Array<{params: Partial<SchedulerParams>, score: number}>
  }> {
    
    console.log('🔧 Otimizando parâmetros do scheduler...');
    
    const parameterTests = [
      { eta_quantile: 0.7, duration_quantile: 0.7 },
      { eta_quantile: 0.8, duration_quantile: 0.8 },
      { eta_quantile: 0.9, duration_quantile: 0.8 },
      { buffer_multiplier: 0.5 },
      { buffer_multiplier: 1.0 },
      { buffer_multiplier: 1.5 },
    ];

    const results = [];
    let bestScore = Infinity;
    let bestParams = this.params;

    for (const testParams of parameterTests) {
      // Criar parâmetros de teste
      const testConfig = { ...this.params, ...testParams };
      
      // Criar otimizador temporário
      const testOptimizer = new RealTimeOptimizer(
        this.optimizer['etaPredictor'],
        this.optimizer['durationPredictor'], 
        this.optimizer['priorityClassifier'],
        testConfig
      );

      // Gerar agenda com novos parâmetros
      const schedule = await testOptimizer.reoptimize(baseState);
      
      // Simular com menos cenários para velocidade
      const simulation = await new SchedulerSimulator(testOptimizer, testConfig)
        .runMonteCarloSimulation(schedule, baseState, testScenarios);

      // Calcular score (menor é melhor)
      const score = simulation.metrics.avg_delay_minutes + 
                   simulation.metrics.avg_idle_time * 0.5 +
                   simulation.metrics.overtime_probability * 60;

      results.push({ params: testParams, score });

      if (score < bestScore) {
        bestScore = score;
        bestParams = testConfig;
      }
    }

    console.log(`✅ Otimização concluída - Melhor score: ${bestScore.toFixed(2)}`);

    return { bestParams, bestScore, results };
  }
}