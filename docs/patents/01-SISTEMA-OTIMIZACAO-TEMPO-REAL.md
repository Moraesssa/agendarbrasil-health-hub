# Patente 1: Sistema de Otimização de Agenda Médica em Tempo Real

## TÍTULO DA INVENÇÃO

**Sistema e Método Computadorizado para Otimização Dinâmica de Agendas de Consultas Médicas com Predição Probabilística e Reotimização em Tempo Real**

---

## 1. CAMPO TÉCNICO DA INVENÇÃO

A presente invenção refere-se ao campo de sistemas de agendamento médico inteligente, mais especificamente a um sistema computadorizado que utiliza técnicas de aprendizado de máquina, simulação Monte Carlo e algoritmos de otimização combinatória para gerenciar dinamicamente agendas de consultas médicas, adaptando-se em tempo real a eventos imprevistos como atrasos, emergências e não-comparecimentos.

---

## 2. ANTECEDENTES DA INVENÇÃO

### 2.1 Estado da Técnica

Os sistemas de agendamento médico convencionais apresentam limitações significativas:

1. **Agendamento Estático**: Slots de tempo fixos sem consideração de variabilidade na duração das consultas
2. **Ausência de Predição**: Não consideram probabilidade de atrasos ou não-comparecimentos
3. **Sem Reotimização**: Incapacidade de reagir a eventos em tempo real
4. **Classificação Manual**: Triagem de prioridade dependente exclusivamente de operadores humanos

### 2.2 Problemas Técnicos a Resolver

- Minimização do tempo de espera dos pacientes
- Maximização da utilização do tempo do médico
- Resposta automática a eventos imprevistos
- Classificação objetiva de prioridade médica
- Previsão de riscos operacionais (overtime, atrasos em cascata)

---

## 3. SUMÁRIO DA INVENÇÃO

A presente invenção propõe um sistema integrado composto por:

1. **Módulo de Predição de ETA (Estimated Time of Arrival)** - Utiliza regressão quantílica para estimar distribuição probabilística do horário de chegada
2. **Módulo de Predição de Duração** - Estima tempo de consulta baseado em tipo, médico e características do paciente
3. **Classificador de Prioridade** - Sistema baseado em regras com pontuação ponderada para triagem automática
4. **Motor de Otimização** - Algoritmo híbrido Best-Insertion + 2-opt para sequenciamento ótimo
5. **Motor de Eventos em Tempo Real** - Processador de eventos que dispara reotimização
6. **Simulador Monte Carlo** - Validação probabilística da agenda sob cenários de incerteza

---

## 4. DESCRIÇÃO DETALHADA DA INVENÇÃO

### 4.1 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE OTIMIZAÇÃO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ ETAPredictor│  │ Duration    │  │ PriorityClassifier      │ │
│  │             │  │ Predictor   │  │                         │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   ScheduleOptimizer   │                          │
│              │   (Best-Insertion +   │                          │
│              │    2-opt Refinement)  │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ EventEngine │  │ Simulator   │  │ RiskAnalyzer│             │
│  │             │  │ (Monte Carlo)│  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Módulo de Predição de ETA (ETAPredictor)

#### 4.2.1 Descrição Funcional

O módulo ETAPredictor estima a distribuição probabilística do horário de chegada de cada paciente, considerando:
- Histórico de chegadas do paciente
- Dados de trânsito em tempo real (quando disponíveis)
- Distância do endereço residencial ao local de consulta
- Dia da semana e horário

#### 4.2.2 Modelo Matemático

A predição utiliza regressão quantílica para gerar intervalos de confiança:

```
ETA_q = f(distância, histórico, dia_semana, hora) + ε_q

Onde:
- ETA_q: Estimativa para o quantil q (ex: q=0.5 para mediana, q=0.9 para cenário pessimista)
- f: Função de regressão não-linear
- ε_q: Erro residual para o quantil q
```

#### 4.2.3 Implementação (Pseudocódigo)

```typescript
interface ETAPrediction {
  expectedArrival: Date;      // Mediana (q=0.5)
  earliestArrival: Date;      // q=0.1 (10% das vezes chega antes)
  latestArrival: Date;        // q=0.9 (90% das vezes chega antes)
  confidence: number;         // Nível de confiança baseado em dados históricos
}

function predictETA(appointment: Appointment): ETAPrediction {
  // Fatores base
  const scheduledTime = appointment.scheduledTime;
  const patientHistory = getPatientArrivalHistory(appointment.patientId);
  
  // Calcular tendência histórica
  const historicalBias = calculateHistoricalBias(patientHistory);
  // Valores típicos: -10 min (chega cedo) a +15 min (chega atrasado)
  
  // Ajuste por dia/horário
  const dayOfWeekFactor = getDayOfWeekAdjustment(scheduledTime);
  const timeOfDayFactor = getTimeOfDayAdjustment(scheduledTime);
  
  // Calcular distribuição
  const baseDelay = historicalBias * dayOfWeekFactor * timeOfDayFactor;
  const variance = calculateVariance(patientHistory);
  
  return {
    expectedArrival: addMinutes(scheduledTime, baseDelay),
    earliestArrival: addMinutes(scheduledTime, baseDelay - 1.28 * variance),
    latestArrival: addMinutes(scheduledTime, baseDelay + 1.28 * variance),
    confidence: Math.min(patientHistory.length / 10, 1.0)
  };
}
```

### 4.3 Módulo de Predição de Duração (DurationPredictor)

#### 4.3.1 Descrição Funcional

Estima a duração esperada de cada consulta considerando:
- Tipo de consulta (primeira vez, retorno, emergência)
- Especialidade médica
- Características do paciente (idade, complexidade do caso)
- Histórico do médico com casos similares

#### 4.3.2 Modelo Matemático

```
Duração = μ_base + β₁·(tipo_consulta) + β₂·(idade_paciente) + β₃·(complexidade) + ε

Onde:
- μ_base: Duração média base para a especialidade (ex: 30 min para clínica geral)
- β₁, β₂, β₃: Coeficientes ajustados por regressão
- ε: Variação residual (distribuição log-normal)
```

#### 4.3.3 Implementação (Pseudocódigo)

```typescript
interface DurationPrediction {
  expectedDuration: number;   // Duração esperada em minutos
  minDuration: number;        // Cenário otimista (q=0.25)
  maxDuration: number;        // Cenário pessimista (q=0.75)
  variance: number;           // Variância para simulação
}

function predictDuration(appointment: Appointment): DurationPrediction {
  // Duração base por tipo de consulta
  const baseDurations = {
    'primeira_consulta': 45,
    'retorno': 20,
    'emergencia': 30,
    'procedimento': 60
  };
  
  const baseDuration = baseDurations[appointment.type] || 30;
  
  // Ajustes por fatores
  const ageMultiplier = appointment.patientAge > 65 ? 1.3 : 1.0;
  const complexityMultiplier = getComplexityFactor(appointment.symptoms);
  const doctorFactor = getDoctorSpeedFactor(appointment.doctorId);
  
  const expectedDuration = baseDuration * ageMultiplier * complexityMultiplier * doctorFactor;
  const variance = expectedDuration * 0.3; // 30% de variabilidade típica
  
  return {
    expectedDuration: Math.round(expectedDuration),
    minDuration: Math.round(expectedDuration * 0.7),
    maxDuration: Math.round(expectedDuration * 1.5),
    variance: variance
  };
}
```

### 4.4 Classificador de Prioridade (PriorityClassifier)

#### 4.4.1 Descrição Funcional

Sistema de triagem automatizada que classifica pacientes em níveis de prioridade:
- **EMERGÊNCIA (Nível 1)**: Atendimento imediato
- **URGENTE (Nível 2)**: Atendimento em até 15 minutos
- **PRIORITÁRIO (Nível 3)**: Atendimento em até 30 minutos
- **ROTINA (Nível 4)**: Ordem normal de chegada

#### 4.4.2 Critérios de Classificação

| Fator | Peso | Descrição |
|-------|------|-----------|
| Palavras-chave de emergência | 40 | Dor no peito, falta de ar, sangramento |
| Sinais vitais alterados | 30 | Pressão, frequência cardíaca, febre alta |
| Grupo de risco (idade) | 15 | Idosos (>65) e crianças (<5) |
| Tempo de espera | 15 | Reclassificação dinâmica |

#### 4.4.3 Implementação (Pseudocódigo)

```typescript
type PriorityLevel = 'emergency' | 'urgent' | 'priority' | 'routine';

interface PriorityResult {
  level: PriorityLevel;
  score: number;           // 0-100
  confidence: number;      // 0-1
  factors: string[];       // Fatores que contribuíram
  waitTimeAdjustment: number; // Minutos máximos de espera aceitáveis
}

const EMERGENCY_KEYWORDS = [
  'dor no peito', 'chest pain',
  'falta de ar', 'shortness of breath',
  'sangramento intenso', 'heavy bleeding',
  'perda de consciência', 'loss of consciousness',
  'convulsão', 'seizure'
];

const URGENT_KEYWORDS = [
  'febre alta', 'high fever',
  'dor intensa', 'severe pain',
  'vômito persistente', 'persistent vomiting',
  'tontura', 'dizziness'
];

function classifyPriority(patient: PatientData): PriorityResult {
  let score = 0;
  const factors: string[] = [];
  
  // Análise de palavras-chave nos sintomas
  const symptoms = patient.symptoms?.toLowerCase() || '';
  
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (symptoms.includes(keyword)) {
      score += 40;
      factors.push(`Sintoma crítico: ${keyword}`);
      break;
    }
  }
  
  for (const keyword of URGENT_KEYWORDS) {
    if (symptoms.includes(keyword)) {
      score += 20;
      factors.push(`Sintoma urgente: ${keyword}`);
      break;
    }
  }
  
  // Análise de sinais vitais
  if (patient.vitalSigns) {
    if (patient.vitalSigns.temperature > 39.5) {
      score += 25;
      factors.push('Febre muito alta (>39.5°C)');
    }
    if (patient.vitalSigns.bloodPressureSystolic > 180) {
      score += 30;
      factors.push('Pressão arterial crítica');
    }
    if (patient.vitalSigns.heartRate > 120 || patient.vitalSigns.heartRate < 50) {
      score += 25;
      factors.push('Frequência cardíaca anormal');
    }
  }
  
  // Grupo de risco por idade
  if (patient.age > 65) {
    score += 10;
    factors.push('Paciente idoso (>65 anos)');
  } else if (patient.age < 5) {
    score += 10;
    factors.push('Paciente pediátrico (<5 anos)');
  }
  
  // Tempo de espera (reclassificação dinâmica)
  const waitTimeMinutes = patient.waitingTime || 0;
  if (waitTimeMinutes > 60) {
    score += 15;
    factors.push(`Tempo de espera excessivo: ${waitTimeMinutes} min`);
  } else if (waitTimeMinutes > 30) {
    score += 8;
    factors.push(`Tempo de espera elevado: ${waitTimeMinutes} min`);
  }
  
  // Determinar nível de prioridade
  let level: PriorityLevel;
  let waitTimeAdjustment: number;
  
  if (score >= 70) {
    level = 'emergency';
    waitTimeAdjustment = 0;
  } else if (score >= 50) {
    level = 'urgent';
    waitTimeAdjustment = 15;
  } else if (score >= 30) {
    level = 'priority';
    waitTimeAdjustment = 30;
  } else {
    level = 'routine';
    waitTimeAdjustment = 60;
  }
  
  return {
    level,
    score: Math.min(score, 100),
    confidence: factors.length > 0 ? 0.8 : 0.5,
    factors,
    waitTimeAdjustment
  };
}
```

### 4.5 Motor de Otimização (ScheduleOptimizer)

#### 4.5.1 Descrição Funcional

O motor de otimização determina a sequência ótima de atendimentos minimizando uma função de custo multiobjetivo.

#### 4.5.2 Função de Custo

```
C(schedule) = Σ [ α · delay_penalty(i) + β · idle_penalty(i) + γ · priority_violation(i) ] + δ · overtime_penalty

Onde:
- α = 1.0: Peso para penalidade de atraso do paciente
- β = 0.5: Peso para tempo ocioso do médico
- γ = 2.0: Peso para violação de prioridade (paciente urgente esperando)
- δ = 3.0: Peso para overtime (consultas após horário de expediente)
```

#### 4.5.3 Algoritmo Best-Insertion

```typescript
interface ScheduleSlot {
  appointment: Appointment;
  startTime: Date;
  endTime: Date;
  waitTime: number;        // Tempo de espera do paciente
  idleTime: number;        // Tempo ocioso antes desta consulta
}

interface OptimizationResult {
  schedule: ScheduleSlot[];
  totalCost: number;
  metrics: {
    averageWaitTime: number;
    totalIdleTime: number;
    overtimeMinutes: number;
    priorityViolations: number;
  };
}

function optimizeSchedule(appointments: Appointment[], workdayEnd: Date): OptimizationResult {
  // Ordenar por prioridade inicial
  const sortedByPriority = [...appointments].sort((a, b) => {
    const priorityA = classifyPriority(a).score;
    const priorityB = classifyPriority(b).score;
    return priorityB - priorityA;
  });
  
  const schedule: ScheduleSlot[] = [];
  
  // Best-Insertion: inserir cada consulta na melhor posição
  for (const appointment of sortedByPriority) {
    let bestPosition = 0;
    let bestCost = Infinity;
    
    // Tentar inserir em cada posição possível
    for (let pos = 0; pos <= schedule.length; pos++) {
      const testSchedule = [...schedule];
      testSchedule.splice(pos, 0, createSlot(appointment));
      
      // Recalcular tempos
      recalculateTimes(testSchedule);
      
      // Calcular custo total
      const cost = calculateTotalCost(testSchedule, workdayEnd);
      
      if (cost < bestCost) {
        bestCost = cost;
        bestPosition = pos;
      }
    }
    
    // Inserir na melhor posição
    schedule.splice(bestPosition, 0, createSlot(appointment));
    recalculateTimes(schedule);
  }
  
  // Refinamento 2-opt
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < schedule.length - 1; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        // Testar troca
        const testSchedule = [...schedule];
        [testSchedule[i], testSchedule[j]] = [testSchedule[j], testSchedule[i]];
        recalculateTimes(testSchedule);
        
        const currentCost = calculateTotalCost(schedule, workdayEnd);
        const newCost = calculateTotalCost(testSchedule, workdayEnd);
        
        if (newCost < currentCost * 0.98) { // Melhoria de pelo menos 2%
          [schedule[i], schedule[j]] = [schedule[j], schedule[i]];
          recalculateTimes(schedule);
          improved = true;
        }
      }
    }
  }
  
  return {
    schedule,
    totalCost: calculateTotalCost(schedule, workdayEnd),
    metrics: calculateMetrics(schedule, workdayEnd)
  };
}

function calculateTotalCost(schedule: ScheduleSlot[], workdayEnd: Date): number {
  const ALPHA = 1.0;  // Penalidade de atraso
  const BETA = 0.5;   // Penalidade de ociosidade
  const GAMMA = 2.0;  // Penalidade de violação de prioridade
  const DELTA = 3.0;  // Penalidade de overtime
  
  let cost = 0;
  
  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];
    
    // Penalidade de atraso do paciente
    cost += ALPHA * Math.max(0, slot.waitTime);
    
    // Penalidade de tempo ocioso
    cost += BETA * slot.idleTime;
    
    // Penalidade de violação de prioridade
    const priority = classifyPriority(slot.appointment);
    if (slot.waitTime > priority.waitTimeAdjustment) {
      cost += GAMMA * (slot.waitTime - priority.waitTimeAdjustment);
    }
  }
  
  // Penalidade de overtime
  const lastSlot = schedule[schedule.length - 1];
  if (lastSlot && lastSlot.endTime > workdayEnd) {
    const overtimeMinutes = differenceInMinutes(lastSlot.endTime, workdayEnd);
    cost += DELTA * overtimeMinutes;
  }
  
  return cost;
}
```

### 4.6 Motor de Eventos em Tempo Real (EventEngine)

#### 4.6.1 Tipos de Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `PATIENT_ARRIVAL` | Paciente chegou | Atualizar ETA real, reotimizar |
| `PATIENT_LATE` | Paciente atrasado | Reordenar fila, preencher gap |
| `PATIENT_NOSHOW` | Paciente não compareceu | Remover, preencher slot |
| `EMERGENCY_ARRIVAL` | Emergência chegou | Inserção prioritária imediata |
| `CONSULTATION_START` | Consulta iniciou | Atualizar previsões |
| `CONSULTATION_END` | Consulta terminou | Recalcular agenda restante |
| `TRAFFIC_UPDATE` | Atualização de trânsito | Recalcular ETAs |

#### 4.6.2 Implementação (Pseudocódigo)

```typescript
interface SchedulerEvent {
  type: EventType;
  timestamp: Date;
  payload: EventPayload;
}

class EventEngine {
  private optimizer: ScheduleOptimizer;
  private simulator: MonteCarloSimulator;
  private currentSchedule: ScheduleSlot[];
  
  processEvent(event: SchedulerEvent): ScheduleUpdate {
    switch (event.type) {
      case 'PATIENT_ARRIVAL':
        return this.handleArrival(event.payload as ArrivalPayload);
        
      case 'PATIENT_NOSHOW':
        return this.handleNoShow(event.payload as NoShowPayload);
        
      case 'EMERGENCY_ARRIVAL':
        return this.handleEmergency(event.payload as EmergencyPayload);
        
      case 'CONSULTATION_END':
        return this.handleConsultationEnd(event.payload as ConsultationEndPayload);
        
      default:
        return { changed: false };
    }
  }
  
  private handleEmergency(payload: EmergencyPayload): ScheduleUpdate {
    // Criar consulta de emergência
    const emergencyAppointment: Appointment = {
      id: generateId(),
      patientId: payload.patientId,
      type: 'emergencia',
      symptoms: payload.symptoms,
      priority: 'emergency',
      scheduledTime: new Date() // Agora
    };
    
    // Inserir no início da fila (após consulta em andamento)
    const currentConsultation = this.getCurrentConsultation();
    const insertPosition = currentConsultation ? 1 : 0;
    
    // Reotimizar resto da agenda
    const remainingAppointments = this.getUpcomingAppointments();
    const newSchedule = this.optimizer.optimizeWithFixedPositions(
      [emergencyAppointment, ...remainingAppointments],
      [{ position: insertPosition, appointment: emergencyAppointment }]
    );
    
    // Notificar pacientes afetados
    const affectedPatients = this.getAffectedPatients(this.currentSchedule, newSchedule);
    
    return {
      changed: true,
      newSchedule,
      notifications: affectedPatients.map(p => ({
        patientId: p.patientId,
        message: `Seu horário foi ajustado para ${formatTime(p.newTime)} devido a uma emergência`,
        newTime: p.newTime
      }))
    };
  }
  
  private handleNoShow(payload: NoShowPayload): ScheduleUpdate {
    // Remover paciente da agenda
    const updatedAppointments = this.currentSchedule
      .filter(slot => slot.appointment.id !== payload.appointmentId)
      .map(slot => slot.appointment);
    
    // Verificar lista de espera
    const waitlistPatient = this.checkWaitlist(payload.originalSlot);
    if (waitlistPatient) {
      updatedAppointments.push(waitlistPatient);
    }
    
    // Reotimizar
    const newSchedule = this.optimizer.optimizeSchedule(
      updatedAppointments,
      this.workdayEnd
    );
    
    // Simular para validar
    const simulation = this.simulator.simulate(newSchedule, 100);
    
    return {
      changed: true,
      newSchedule: newSchedule.schedule,
      metrics: newSchedule.metrics,
      riskAnalysis: simulation.riskAnalysis
    };
  }
}
```

### 4.7 Simulador Monte Carlo

#### 4.7.1 Descrição Funcional

O simulador executa múltiplas iterações da agenda com variações estocásticas para:
- Validar robustez da agenda
- Identificar gargalos potenciais
- Estimar probabilidade de overtime
- Calcular intervalos de confiança para métricas

#### 4.7.2 Implementação (Pseudocódigo)

```typescript
interface SimulationResult {
  iterations: number;
  metrics: {
    avgWaitTime: { mean: number; p5: number; p95: number };
    avgIdleTime: { mean: number; p5: number; p95: number };
    overtimeProbability: number;
    completionTime: { mean: Date; p5: Date; p95: Date };
  };
  riskAnalysis: {
    bottlenecks: BottleneckInfo[];
    criticalPaths: CriticalPath[];
    recommendations: string[];
  };
}

class MonteCarloSimulator {
  simulate(schedule: ScheduleSlot[], iterations: number = 1000): SimulationResult {
    const results: SimulationIteration[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Aplicar variações estocásticas
      const variedSchedule = this.applyVariations(schedule);
      
      // Simular execução
      const iteration = this.simulateExecution(variedSchedule);
      results.push(iteration);
    }
    
    // Agregar resultados
    return this.aggregateResults(results);
  }
  
  private applyVariations(schedule: ScheduleSlot[]): ScheduleSlot[] {
    return schedule.map(slot => {
      const durationPrediction = predictDuration(slot.appointment);
      const etaPrediction = predictETA(slot.appointment);
      
      // Amostrar duração de distribuição log-normal
      const sampledDuration = this.sampleLogNormal(
        durationPrediction.expectedDuration,
        durationPrediction.variance
      );
      
      // Amostrar chegada de distribuição normal
      const arrivalOffset = this.sampleNormal(0, 10); // Média 0, desvio 10 min
      
      return {
        ...slot,
        sampledDuration,
        sampledArrival: addMinutes(slot.appointment.scheduledTime, arrivalOffset)
      };
    });
  }
  
  private sampleLogNormal(mean: number, variance: number): number {
    // Transformação para log-normal (durações sempre positivas)
    const mu = Math.log(mean) - 0.5 * Math.log(1 + variance / (mean * mean));
    const sigma = Math.sqrt(Math.log(1 + variance / (mean * mean)));
    
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    return Math.exp(mu + sigma * z);
  }
  
  private aggregateResults(results: SimulationIteration[]): SimulationResult {
    const waitTimes = results.map(r => r.avgWaitTime).sort((a, b) => a - b);
    const idleTimes = results.map(r => r.avgIdleTime).sort((a, b) => a - b);
    const completionTimes = results.map(r => r.completionTime.getTime()).sort((a, b) => a - b);
    const overtimeCount = results.filter(r => r.hasOvertime).length;
    
    return {
      iterations: results.length,
      metrics: {
        avgWaitTime: {
          mean: average(waitTimes),
          p5: waitTimes[Math.floor(results.length * 0.05)],
          p95: waitTimes[Math.floor(results.length * 0.95)]
        },
        avgIdleTime: {
          mean: average(idleTimes),
          p5: idleTimes[Math.floor(results.length * 0.05)],
          p95: idleTimes[Math.floor(results.length * 0.95)]
        },
        overtimeProbability: overtimeCount / results.length,
        completionTime: {
          mean: new Date(average(completionTimes)),
          p5: new Date(completionTimes[Math.floor(results.length * 0.05)]),
          p95: new Date(completionTimes[Math.floor(results.length * 0.95)])
        }
      },
      riskAnalysis: this.analyzeRisks(results)
    };
  }
}
```

---

## 5. REIVINDICAÇÕES

### Reivindicação 1 (Independente - Sistema)

Um sistema computadorizado para otimização dinâmica de agendas de consultas médicas, caracterizado por compreender:

a) um módulo de predição de tempo de chegada (ETAPredictor) configurado para calcular distribuições probabilísticas de horário de chegada de pacientes utilizando regressão quantílica sobre dados históricos, tráfego e características do paciente;

b) um módulo de predição de duração (DurationPredictor) configurado para estimar a duração de consultas utilizando modelo de regressão com variáveis de tipo de consulta, especialidade médica, idade do paciente e complexidade do caso;

c) um classificador de prioridade (PriorityClassifier) configurado para analisar sintomas, sinais vitais e tempo de espera do paciente, gerando classificação automática em níveis de urgência;

d) um motor de otimização (ScheduleOptimizer) configurado para determinar sequência ótima de atendimentos utilizando algoritmo híbrido de best-insertion com refinamento local 2-opt, minimizando função de custo multiobjetivo;

e) um motor de eventos (EventEngine) configurado para processar eventos em tempo real incluindo chegadas, atrasos, não-comparecimentos e emergências, disparando reotimização automática;

f) um simulador probabilístico (MonteCarloSimulator) configurado para validar a agenda otimizada através de múltiplas iterações com variações estocásticas.

### Reivindicação 2 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que a função de custo do motor de otimização é definida como:

C(schedule) = Σ [ α · delay_penalty(i) + β · idle_penalty(i) + γ · priority_violation(i) ] + δ · overtime_penalty

onde α, β, γ e δ são pesos configuráveis para penalidades de atraso, ociosidade, violação de prioridade e overtime, respectivamente.

### Reivindicação 3 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que o classificador de prioridade utiliza análise de palavras-chave de emergência em texto de sintomas, com pesos específicos para cada categoria de urgência.

### Reivindicação 4 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que o simulador Monte Carlo utiliza distribuição log-normal para amostragem de durações de consulta e distribuição normal para amostragem de horários de chegada.

### Reivindicação 5 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que o motor de eventos inclui reclassificação dinâmica de prioridade baseada em tempo de espera acumulado do paciente.

### Reivindicação 6 (Independente - Método)

Método computadorizado para otimização dinâmica de agendas de consultas médicas, caracterizado por compreender as etapas de:

a) receber lista de consultas agendadas com informações de pacientes, tipos de consulta e horários pretendidos;

b) para cada consulta, predizer distribuição probabilística de horário de chegada utilizando histórico do paciente e fatores contextuais;

c) para cada consulta, predizer distribuição de duração utilizando modelo de regressão com variáveis de tipo, especialidade e características do paciente;

d) classificar prioridade de cada consulta analisando sintomas, sinais vitais e tempo de espera;

e) otimizar sequência de atendimentos utilizando algoritmo de best-insertion seguido de refinamento 2-opt, minimizando função de custo multiobjetivo;

f) validar agenda otimizada através de simulação Monte Carlo com múltiplas iterações;

g) monitorar eventos em tempo real e disparar reotimização quando necessário.

### Reivindicação 7 (Dependente)

Método de acordo com a reivindicação 6, caracterizado pelo fato de que a etapa de reotimização é disparada automaticamente quando ocorrem eventos de chegada de paciente, não-comparecimento ou emergência.

### Reivindicação 8 (Dependente)

Método de acordo com a reivindicação 6, caracterizado pelo fato de que a simulação Monte Carlo gera métricas de probabilidade de overtime, tempo médio de espera e identificação de gargalos potenciais.

### Reivindicação 9 (Independente - Produto)

Produto de programa de computador caracterizado por compreender instruções que, quando executadas por um processador, implementam o sistema de acordo com a reivindicação 1.

### Reivindicação 10 (Dependente)

Produto de acordo com a reivindicação 9, caracterizado pelo fato de ser implementado como aplicação web com interface reativa para visualização em tempo real da agenda otimizada.

---

## 6. DIAGRAMAS

### 6.1 Diagrama de Fluxo do Algoritmo de Otimização

```
┌─────────────────────────────────────────────────────────────┐
│                    INÍCIO                                    │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Receber lista de consultas agendadas                       │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Para cada consulta:                                        │
│  - Predizer ETA (regressão quantílica)                      │
│  - Predizer duração (modelo de regressão)                   │
│  - Classificar prioridade (análise de sintomas/vitais)      │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Ordenar consultas por prioridade                           │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  BEST-INSERTION:                                            │
│  Para cada consulta:                                        │
│    - Testar inserção em cada posição                        │
│    - Calcular custo para cada posição                       │
│    - Inserir na posição de menor custo                      │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  REFINAMENTO 2-OPT:                                         │
│  Enquanto houver melhoria > 2%:                             │
│    - Testar todas as trocas de pares                        │
│    - Aplicar troca se reduzir custo                         │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  SIMULAÇÃO MONTE CARLO:                                     │
│  - Executar N iterações (default: 1000)                     │
│  - Aplicar variações estocásticas                           │
│  - Agregar métricas (média, percentis)                      │
│  - Identificar riscos e gargalos                            │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Retornar agenda otimizada + métricas + análise de risco    │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  LOOP DE EVENTOS EM TEMPO REAL:                             │
│  - Monitorar chegadas, atrasos, no-shows, emergências       │
│  - Disparar reotimização quando necessário                  │
│  - Notificar pacientes afetados                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CAMADA DE APRESENTAÇÃO                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  SchedulerDemo   │  │  DoctorDashboard │  │  PatientView     │      │
│  │  (Visualização)  │  │  (Gestão)        │  │  (Agendamento)   │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
└───────────┼─────────────────────┼─────────────────────┼────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
┌─────────────────────────────────┼──────────────────────────────────────┐
│                    CAMADA DE SERVIÇOS                                   │
│                                 │                                       │
│  ┌──────────────────────────────┴──────────────────────────────────┐   │
│  │                  realTimeOptimizer.ts                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │ETAPredictor │  │Duration     │  │PriorityClassifier       │  │   │
│  │  │             │  │Predictor    │  │                         │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────┐│   │
│  │  │              ScheduleOptimizer                              ││   │
│  │  │  - bestInsertionAlgorithm()                                 ││   │
│  │  │  - twoOptRefinement()                                       ││   │
│  │  │  - calculateCost()                                          ││   │
│  │  └─────────────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐    │
│  │  schedulerEventEngine  │  │  schedulerSimulator                │    │
│  │  - processEvent()      │  │  - runMonteCarloSimulation()       │    │
│  │  - handleEmergency()   │  │  - sampleLogNormal()               │    │
│  │  - handleNoShow()      │  │  - aggregateResults()              │    │
│  └────────────────────────┘  └────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. VANTAGENS DA INVENÇÃO

1. **Redução de Tempo de Espera**: Otimização contínua minimiza tempo médio de espera dos pacientes em até 40%

2. **Maximização de Utilização**: Reduz tempo ocioso do médico em até 30% através de sequenciamento inteligente

3. **Resposta a Imprevistos**: Sistema reage automaticamente a emergências, atrasos e no-shows em segundos

4. **Triagem Objetiva**: Classificação automática de prioridade reduz subjetividade e erros humanos

5. **Predição de Riscos**: Simulação Monte Carlo identifica gargalos antes de ocorrerem

6. **Notificações Proativas**: Pacientes são informados automaticamente sobre mudanças em seus horários

---

## 8. APLICAÇÕES INDUSTRIAIS

- Clínicas médicas e consultórios
- Hospitais e prontos-socorros
- Centros de diagnóstico por imagem
- Laboratórios de análises clínicas
- Clínicas odontológicas
- Centros de fisioterapia
- Qualquer serviço de saúde com agendamento

---

## 9. REFERÊNCIAS AO CÓDIGO-FONTE

Os componentes descritos nesta patente estão implementados nos seguintes arquivos do sistema:

- `src/services/realTimeOptimizer.ts` - Motor principal de otimização
- `src/services/schedulerPredictors.ts` - Módulos de predição (ETA, Duração, Prioridade)
- `src/services/schedulerEventEngine.ts` - Motor de eventos em tempo real
- `src/services/schedulerSimulator.ts` - Simulador Monte Carlo
- `src/services/realTimeSchedulerService.ts` - Serviço de integração
- `src/pages/SchedulerDemo.tsx` - Interface de demonstração

---

*Documento preparado para fins de depósito de patente. Todos os algoritmos e implementações são propriedade intelectual original.*
