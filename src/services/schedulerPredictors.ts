/**
 * Preditores para o Scheduler em Tempo Real
 * Implementa regressão quantílica e predições baseadas em histórico
 */

import { QuantileDistribution, HistoricalData, SchedulerPatient, TransportMode } from '@/types/realTimeScheduler';

export class ETAPredictor {
  private historicalData: HistoricalData;
  
  constructor(historicalData: HistoricalData) {
    this.historicalData = historicalData;
  }

  /**
   * Prediz distribuição de chegada baseada em distância, trânsito e histórico
   */
  async predictArrivalDistribution(
    patient: SchedulerPatient,
    currentTrafficMultiplier: number = 1.0
  ): Promise<QuantileDistribution> {
    // Filtrar dados históricos similares
    const similarArrivals = this.historicalData.patient_arrivals.filter(arrival => {
      const distanceDiff = Math.abs(arrival.distance_km - patient.distance_km);
      return distanceDiff <= 2.0; // ±2km de tolerância
    });

    if (similarArrivals.length < 5) {
      // Fallback para dados gerais se não há histórico suficiente
      return this.getDefaultETADistribution(patient.distance_km, currentTrafficMultiplier);
    }

    // Calcular offsets históricos (minutos de atraso/antecipação)
    const offsets = similarArrivals.map(arrival => {
      const scheduledTime = arrival.scheduled_time.getTime();
      const actualTime = arrival.actual_arrival.getTime();
      return (actualTime - scheduledTime) / (1000 * 60); // minutos
    });

    // Aplicar correção de trânsito atual
    const adjustedOffsets = offsets.map(offset => offset * currentTrafficMultiplier);

    // Calcular quantis empíricos
    const sortedOffsets = adjustedOffsets.sort((a, b) => a - b);
    
    return {
      p50: this.calculateQuantile(sortedOffsets, 0.5),
      p80: this.calculateQuantile(sortedOffsets, 0.8),
      p95: this.calculateQuantile(sortedOffsets, 0.95)
    };
  }

  private getDefaultETADistribution(distanceKm: number, trafficMultiplier: number): QuantileDistribution {
    // Modelo simples baseado em distância
    const baseDelayMinutes = Math.max(0, distanceKm * 2 - 5); // 2 min/km, -5 min base
    const variabilityMinutes = Math.max(5, distanceKm * 1.5); // variabilidade cresce com distância
    
    return {
      p50: baseDelayMinutes * trafficMultiplier,
      p80: (baseDelayMinutes + variabilityMinutes) * trafficMultiplier,
      p95: (baseDelayMinutes + variabilityMinutes * 2) * trafficMultiplier
    };
  }

  private calculateQuantile(sortedArray: number[], quantile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = quantile * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}

export class DurationPredictor {
  private historicalData: HistoricalData;
  
  constructor(historicalData: HistoricalData) {
    this.historicalData = historicalData;
  }

  /**
   * Prediz distribuição de duração baseada em motivo, médico e características
   */
  predictDurationDistribution(patient: SchedulerPatient): QuantileDistribution {
    // Filtrar consultas similares
    const similarConsultations = this.historicalData.consultation_durations.filter(consultation => {
      return consultation.reason === patient.reason && 
             consultation.doctor_id === patient.doctor_id;
    });

    if (similarConsultations.length < 3) {
      // Fallback para dados do mesmo motivo, qualquer médico
      const reasonConsultations = this.historicalData.consultation_durations.filter(
        consultation => consultation.reason === patient.reason
      );
      
      if (reasonConsultations.length >= 3) {
        return this.calculateDurationQuantiles(reasonConsultations);
      }
      
      // Fallback final: distribuição padrão por motivo
      return this.getDefaultDurationDistribution(patient.reason);
    }

    return this.calculateDurationQuantiles(similarConsultations);
  }

  private calculateDurationQuantiles(consultations: any[]): QuantileDistribution {
    const durations = consultations.map(c => c.actual_duration).sort((a, b) => a - b);
    
    return {
      p50: this.calculateQuantile(durations, 0.5),
      p80: this.calculateQuantile(durations, 0.8),
      p95: this.calculateQuantile(durations, 0.95)
    };
  }

  private getDefaultDurationDistribution(reason: string): QuantileDistribution {
    // Distribuições padrão por tipo de consulta
    const defaults: Record<string, QuantileDistribution> = {
      'checkup': { p50: 20, p80: 25, p95: 35 },
      'followup': { p50: 15, p80: 20, p95: 30 },
      'procedure': { p50: 40, p80: 50, p95: 70 },
      'consult': { p50: 30, p80: 40, p95: 55 },
      'emergency': { p50: 25, p80: 35, p95: 60 }
    };

    return defaults[reason] || defaults['consult'];
  }

  private calculateQuantile(sortedArray: number[], quantile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = quantile * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}

export class PriorityClassifier {
  /**
   * Classifica prioridade baseada em sintomas, urgência e contexto
   */
  classifyPriority(
    symptoms: string[],
    patientAge: number,
    vitalSigns?: Record<string, number>
  ): { priority: 'emergency' | 'high' | 'normal' | 'low'; confidence: number } {
    
    // Palavras-chave de emergência
    const emergencyKeywords = [
      'dor no peito', 'falta de ar', 'sangramento', 'desmaio', 
      'convulsão', 'trauma', 'queimadura grave', 'overdose'
    ];
    
    // Palavras-chave de alta prioridade
    const highPriorityKeywords = [
      'dor intensa', 'febre alta', 'vômito persistente', 
      'dificuldade respiratória', 'dor abdominal severa'
    ];

    const symptomsText = symptoms.join(' ').toLowerCase();
    
    // Verificar emergência
    const hasEmergencySymptoms = emergencyKeywords.some(keyword => 
      symptomsText.includes(keyword)
    );
    
    if (hasEmergencySymptoms) {
      return { priority: 'emergency', confidence: 0.9 };
    }

    // Verificar sinais vitais críticos
    if (vitalSigns) {
      const { temperature, heartRate, bloodPressureSystolic } = vitalSigns;
      
      if (temperature > 39.5 || heartRate > 120 || bloodPressureSystolic > 180) {
        return { priority: 'emergency', confidence: 0.85 };
      }
      
      if (temperature > 38.5 || heartRate > 100 || bloodPressureSystolic > 160) {
        return { priority: 'high', confidence: 0.8 };
      }
    }

    // Verificar alta prioridade
    const hasHighPrioritySymptoms = highPriorityKeywords.some(keyword => 
      symptomsText.includes(keyword)
    );
    
    if (hasHighPrioritySymptoms) {
      return { priority: 'high', confidence: 0.75 };
    }

    // Considerar idade para priorização
    if (patientAge >= 65 || patientAge <= 2) {
      return { priority: 'high', confidence: 0.6 };
    }

    // Prioridade normal por padrão
    return { priority: 'normal', confidence: 0.7 };
  }

  /**
   * Reclassifica prioridade em tempo real baseada em novos dados
   */
  reclassifyPriority(
    currentPriority: string,
    newSymptoms?: string[],
    waitingTimeMinutes?: number,
    vitalSigns?: Record<string, number>
  ): { priority: 'emergency' | 'high' | 'normal' | 'low'; confidence: number; changed: boolean } {
    
    let newClassification = { priority: currentPriority as any, confidence: 0.7 };
    
    // Reclassificar se há novos sintomas
    if (newSymptoms && newSymptoms.length > 0) {
      newClassification = this.classifyPriority(newSymptoms, 0, vitalSigns);
    }
    
    // Escalar prioridade se tempo de espera for muito longo
    if (waitingTimeMinutes && waitingTimeMinutes > 60) {
      if (currentPriority === 'normal') {
        newClassification = { priority: 'high', confidence: 0.6 };
      } else if (currentPriority === 'low') {
        newClassification = { priority: 'normal', confidence: 0.6 };
      }
    }

    const changed = newClassification.priority !== currentPriority;
    
    return {
      ...newClassification,
      changed
    };
  }
}

// Factory para criar preditores com dados históricos
export class PredictorFactory {
  static createPredictors(historicalData: HistoricalData) {
    return {
      etaPredictor: new ETAPredictor(historicalData),
      durationPredictor: new DurationPredictor(historicalData),
      priorityClassifier: new PriorityClassifier()
    };
  }

  static createMockHistoricalData(): HistoricalData {
    // Gerar dados sintéticos para desenvolvimento/teste
    const now = new Date();
    const mockData: HistoricalData = {
      patient_arrivals: [],
      consultation_durations: [],
      no_shows: []
    };

    // Gerar 500 chegadas históricas
    for (let i = 0; i < 500; i++) {
      const scheduledTime = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const distanceKm = Math.random() * 20 + 1;
      const baseDelay = Math.max(-10, Math.random() * 20 - 5); // -10 a +15 min
      const actualArrival = new Date(scheduledTime.getTime() + baseDelay * 60 * 1000);
      
      mockData.patient_arrivals.push({
        scheduled_time: scheduledTime,
        actual_arrival: actualArrival,
        distance_km: distanceKm,
        traffic_conditions: Math.random() > 0.7 ? 'heavy' : 'normal'
      });
    }

    // Gerar 300 durações de consulta
    const reasons = ['checkup', 'followup', 'procedure', 'consult', 'emergency'];
    const doctors = ['dr1', 'dr2', 'dr3'];
    
    for (let i = 0; i < 300; i++) {
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const doctorId = doctors[Math.floor(Math.random() * doctors.length)];
      const baseDuration = { checkup: 20, followup: 15, procedure: 40, consult: 30, emergency: 25 }[reason];
      const actualDuration = Math.max(5, baseDuration + (Math.random() - 0.5) * baseDuration * 0.5);
      
      mockData.consultation_durations.push({
        reason,
        doctor_id: doctorId,
        planned_duration: baseDuration,
        actual_duration: actualDuration,
        patient_characteristics: {}
      });
    }

    return mockData;
  }
}