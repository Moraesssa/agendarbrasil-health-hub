/**
 * Demonstração do Algoritmo de Scheduler em Tempo Real
 * Interface para testar e visualizar o algoritmo revolucionário
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Zap,
  Brain,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';

import { 
  realTimeScheduler, 
  RealTimeSchedulerService 
} from '@/services/realTimeSchedulerService';
import { 
  OptimizedSchedule, 
  SchedulerPatient, 
  SimulationResult,
  SchedulerEvent 
} from '@/types/realTimeScheduler';

export const RealTimeSchedulerDemo: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<OptimizedSchedule | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [patients, setPatients] = useState<SchedulerPatient[]>([]);
  const [events, setEvents] = useState<SchedulerEvent[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    initializeScheduler();
    
    // Atualizar stats a cada 5 segundos
    const interval = setInterval(() => {
      if (isInitialized) {
        setStats(realTimeScheduler.getSystemStats());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const initializeScheduler = async () => {
    try {
      setIsLoading(true);
      
      // Configurar callbacks
      realTimeScheduler.setCallbacks({
        onScheduleUpdated: (schedule) => {
          setCurrentSchedule(schedule);
          console.log('📅 Agenda atualizada:', schedule);
        },
        onEventProcessed: (event, result) => {
          setEvents(prev => [event, ...prev.slice(0, 9)]); // Manter últimos 10
          console.log('⚡ Evento processado:', event.type);
        },
        onError: (error) => {
          console.error('❌ Erro no scheduler:', error);
        }
      });

      // Inicializar com dados mock
      await realTimeScheduler.initialize();
      
      // Gerar pacientes de exemplo
      generateSamplePatients();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Erro na inicialização:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSamplePatients = () => {
    const now = new Date();
    const samplePatients: SchedulerPatient[] = [];

    // Gerar 8 pacientes com horários espaçados
    for (let i = 0; i < 8; i++) {
      const scheduledTime = new Date(now.getTime() + (i * 30 + 60) * 60 * 1000); // A cada 30min, começando em 1h
      const priorities: Array<'emergency' | 'high' | 'normal' | 'low'> = ['normal', 'normal', 'high', 'normal', 'normal', 'low', 'normal', 'emergency'];
      const reasons = ['checkup', 'followup', 'procedure', 'consult', 'emergency'];
      
      const patient = RealTimeSchedulerService.createSamplePatient(
        `P${i + 1}`,
        priorities[i] || 'normal',
        scheduledTime,
        reasons[Math.floor(Math.random() * reasons.length)]
      );

      // Adicionar variação realística
      patient.distance_km = Math.random() * 15 + 1;
      patient.eta_distribution = {
        p50: Math.random() * 10 - 5,  // -5 a +5 min
        p80: Math.random() * 15 + 5,  // 5 a 20 min
        p95: Math.random() * 25 + 15  // 15 a 40 min
      };

      samplePatients.push(patient);
    }

    setPatients(samplePatients);
  };

  const runOptimization = async () => {
    if (!isInitialized || patients.length === 0) return;

    try {
      setIsLoading(true);
      const result = await realTimeScheduler.optimizeSchedule('dr1', patients);
      setCurrentSchedule(result);
    } catch (error) {
      console.error('Erro na otimização:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!currentSchedule) return;

    try {
      setIsLoading(true);
      
      const state = {
        current_time: new Date(),
        doctor_id: 'dr1',
        scheduled_queue: patients,
        waiting_queue: [],
        doctor_config: {
          clinic_start: new Date(),
          clinic_end: new Date(Date.now() + 9 * 60 * 60 * 1000), // 9h depois
          break_times: [],
          emergency_buffer_minutes: 15,
          max_overtime_minutes: 60
        }
      };

      const simulation = await realTimeScheduler.runSimulation(currentSchedule, state, 500);
      setSimulationResult(simulation);
    } catch (error) {
      console.error('Erro na simulação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateEvent = (type: 'arrival' | 'traffic' | 'emergency' | 'noshow') => {
    if (patients.length === 0) return;

    const randomPatient = patients[Math.floor(Math.random() * patients.length)];

    switch (type) {
      case 'arrival':
        realTimeScheduler.handlePatientArrival(randomPatient.id);
        break;
      case 'traffic':
        realTimeScheduler.handleTrafficUpdate(randomPatient.id, Math.random() * 20 + 5);
        break;
      case 'emergency':
        const emergency = RealTimeSchedulerService.createSamplePatient(
          `E${Date.now()}`,
          'emergency',
          new Date(),
          'emergency'
        );
        realTimeScheduler.handleEmergencyInsert(emergency);
        setPatients(prev => [emergency, ...prev]);
        break;
      case 'noshow':
        realTimeScheduler.handleNoShow(randomPatient.id);
        break;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading && !isInitialized) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Inicializando Algoritmo Revolucionário...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Scheduler em Tempo Real - Algoritmo Revolucionário
          </CardTitle>
          <p className="text-muted-foreground">
            Otimização dinâmica considerando trânsito, duração real e emergências
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runOptimization} disabled={isLoading}>
              <Target className="w-4 h-4 mr-2" />
              Otimizar Agenda
            </Button>
            <Button onClick={runSimulation} disabled={!currentSchedule || isLoading} variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Simular Monte Carlo
            </Button>
            <Button onClick={generateSamplePatients} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Gerar Pacientes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Agenda Otimizada</TabsTrigger>
          <TabsTrigger value="events">Eventos Tempo Real</TabsTrigger>
          <TabsTrigger value="simulation">Simulação Monte Carlo</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Agenda Otimizada */}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Pacientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Pacientes ({patients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {patients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(patient.priority)}>
                          {patient.priority}
                        </Badge>
                        <span className="font-medium">{patient.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {patient.reason} • {formatTime(patient.scheduled_time)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div>ETA: +{patient.eta_distribution.p80.toFixed(0)}min</div>
                      <div>Duração: {patient.duration_distribution.p80.toFixed(0)}min</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Timeline Otimizada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline Otimizada
                </CardTitle>
                {currentSchedule && (
                  <div className="text-sm text-muted-foreground">
                    Custo Total: {currentSchedule.metrics.total_cost.toFixed(2)} • 
                    Atraso: {currentSchedule.metrics.expected_total_delay.toFixed(1)}min • 
                    Ociosidade: {currentSchedule.metrics.expected_idle_time.toFixed(1)}min
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {currentSchedule?.timeline.map((slot, index) => (
                  <div key={slot.patient_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{slot.patient_id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Buffer: {slot.buffer_minutes}min • Confiança: {(slot.confidence_level * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div>{formatTime(slot.planned_start)} - {formatTime(slot.planned_end)}</div>
                      <div className="text-muted-foreground">
                        {Math.round((slot.planned_end.getTime() - slot.planned_start.getTime()) / (1000 * 60))}min
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Eventos Tempo Real */}
        <TabsContent value="events">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simuladores de Evento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Simular Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => simulateEvent('arrival')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Chegada de Paciente
                </Button>
                <Button 
                  onClick={() => simulateEvent('traffic')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Atualização de Trânsito
                </Button>
                <Button 
                  onClick={() => simulateEvent('emergency')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Inserir Emergência
                </Button>
                <Button 
                  onClick={() => simulateEvent('noshow')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Simular No-Show
                </Button>
              </CardContent>
            </Card>

            {/* Log de Eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Log de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <Badge variant="outline">{event.type}</Badge>
                      {event.patient_id && <span className="ml-2">{event.patient_id}</span>}
                    </div>
                    <span className="text-muted-foreground">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum evento processado ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Simulação Monte Carlo */}
        <TabsContent value="simulation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Resultados da Simulação Monte Carlo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulationResult ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {simulationResult.metrics.avg_delay_minutes.toFixed(1)}min
                    </div>
                    <p className="text-sm text-muted-foreground">Atraso Médio</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {simulationResult.metrics.p95_delay_minutes.toFixed(1)}min
                    </div>
                    <p className="text-sm text-muted-foreground">Atraso P95</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(simulationResult.metrics.overtime_probability * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Prob. Overtime</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {simulationResult.scenarios_run}
                    </div>
                    <p className="text-sm text-muted-foreground">Cenários</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Execute uma simulação para ver os resultados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estatísticas */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Estatísticas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold">
                        {stats.events.events_in_queue}
                      </div>
                      <p className="text-sm text-muted-foreground">Eventos na Fila</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold">
                        {stats.events.optimizations_count}
                      </div>
                      <p className="text-sm text-muted-foreground">Otimizações</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold">
                        {stats.events.current_patients}
                      </div>
                      <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Status do Sistema</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Inicializado:</span>
                        <Badge variant={stats.scheduler.initialized ? "default" : "destructive"}>
                          {stats.scheduler.initialized ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Processando:</span>
                        <Badge variant={stats.events.is_processing ? "default" : "secondary"}>
                          {stats.events.is_processing ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Última Otimização:</span>
                        <span>{stats.events.last_optimization ? formatTime(new Date(stats.events.last_optimization)) : "Nunca"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Carregando estatísticas...
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};