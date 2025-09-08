/**
 * Demo Realístico do Sistema de Agendamento para Telemedicina
 * Simula cenários reais com médicos, pacientes e famílias
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Phone,
  Stethoscope,
  Baby,
  Heart,
  Activity,
  CheckCircle,
  XCircle,
  Timer,
  UserPlus
} from 'lucide-react';

// Tipos específicos para o demo
interface DemoDoctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  consultationTypes: {
    initial: number;
    followup: number;
    telemedicine: number;
  };
  workingHours: {
    start: string;
    end: string;
  };
  currentStatus: 'available' | 'busy' | 'break';
}

interface DemoPatient {
  id: string;
  name: string;
  age: number;
  type: 'adult' | 'child' | 'elderly';
  familyGroup?: string;
  consultationType: 'telemedicine' | 'presential';
  appointmentType: 'initial' | 'followup' | 'emergency';
  scheduledTime: Date;
  estimatedDuration: number;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  status: 'scheduled' | 'waiting' | 'in_consultation' | 'completed' | 'no_show';
  notes?: string;
}

interface DemoAppointment {
  id: string;
  doctorId: string;
  patientId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  type: 'telemedicine' | 'presential';
  room?: string;
}

export const TelemedicineSchedulerDemo: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('dr1');
  const [appointments, setAppointments] = useState<DemoAppointment[]>([]);
  const [patients, setPatients] = useState<DemoPatient[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  // Dados mock dos médicos
  const doctors: DemoDoctor[] = [
    {
      id: 'dr1',
      name: 'Dr. Carlos Silva',
      specialty: 'Cardiologia',
      avatar: 'CS',
      consultationTypes: { initial: 45, followup: 30, telemedicine: 25 },
      workingHours: { start: '08:00', end: '17:00' },
      currentStatus: 'available'
    },
    {
      id: 'dr2',
      name: 'Dra. Ana Santos',
      specialty: 'Pediatria',
      avatar: 'AS',
      consultationTypes: { initial: 40, followup: 25, telemedicine: 20 },
      workingHours: { start: '09:00', end: '18:00' },
      currentStatus: 'available'
    },
    {
      id: 'dr3',
      name: 'Dr. Roberto Lima',
      specialty: 'Clínica Geral',
      avatar: 'RL',
      consultationTypes: { initial: 30, followup: 20, telemedicine: 15 },
      workingHours: { start: '07:00', end: '16:00' },
      currentStatus: 'available'
    }
  ];

  // Inicializar dados de exemplo
  useEffect(() => {
    generateSampleData();
    
    // Simular passagem do tempo
    const interval = setInterval(() => {
      if (isRunning) {
        setCurrentTime(prev => new Date(prev.getTime() + 60000)); // +1 minuto
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const generateSampleData = () => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(8, 0, 0, 0);

    // Gerar pacientes de exemplo
    const samplePatients: DemoPatient[] = [
      {
        id: 'p1',
        name: 'Maria Santos',
        age: 45,
        type: 'adult',
        familyGroup: 'santos',
        consultationType: 'telemedicine',
        appointmentType: 'followup',
        scheduledTime: new Date(startOfDay.getTime() + 60 * 60 * 1000), // 9:00
        estimatedDuration: 25,
        priority: 'normal',
        status: 'scheduled',
        notes: 'Acompanhamento diabetes'
      },
      {
        id: 'p2',
        name: 'João Santos',
        age: 12,
        type: 'child',
        familyGroup: 'santos',
        consultationType: 'presential',
        appointmentType: 'initial',
        scheduledTime: new Date(startOfDay.getTime() + 90 * 60 * 1000), // 9:30
        estimatedDuration: 40,
        priority: 'normal',
        status: 'scheduled',
        notes: 'Consulta pediátrica - crescimento'
      },
      {
        id: 'p3',
        name: 'Pedro Oliveira',
        age: 67,
        type: 'elderly',
        consultationType: 'telemedicine',
        appointmentType: 'followup',
        scheduledTime: new Date(startOfDay.getTime() + 150 * 60 * 1000), // 10:30
        estimatedDuration: 30,
        priority: 'high',
        status: 'scheduled',
        notes: 'Hipertensão - ajuste medicação'
      },
      {
        id: 'p4',
        name: 'Ana Costa',
        age: 32,
        type: 'adult',
        consultationType: 'presential',
        appointmentType: 'initial',
        scheduledTime: new Date(startOfDay.getTime() + 180 * 60 * 1000), // 11:00
        estimatedDuration: 45,
        priority: 'normal',
        status: 'scheduled',
        notes: 'Dor no peito - investigação'
      },
      {
        id: 'p5',
        name: 'Carlos Mendes',
        age: 28,
        type: 'adult',
        consultationType: 'telemedicine',
        appointmentType: 'followup',
        scheduledTime: new Date(startOfDay.getTime() + 240 * 60 * 1000), // 12:00
        estimatedDuration: 20,
        priority: 'low',
        status: 'scheduled',
        notes: 'Resultado de exames'
      }
    ];

    setPatients(samplePatients);

    // Gerar appointments correspondentes
    const sampleAppointments: DemoAppointment[] = samplePatients.map((patient, index) => ({
      id: `apt${index + 1}`,
      doctorId: selectedDoctor,
      patientId: patient.id,
      scheduledStart: patient.scheduledTime,
      scheduledEnd: new Date(patient.scheduledTime.getTime() + patient.estimatedDuration * 60 * 1000),
      status: 'scheduled',
      type: patient.consultationType,
      room: patient.consultationType === 'presential' ? `Sala ${index + 1}` : undefined
    }));

    setAppointments(sampleAppointments);
  };

  const simulateEvent = (eventType: string) => {
    const now = new Date();
    let eventMessage = '';

    switch (eventType) {
      case 'emergency':
        const emergency: DemoPatient = {
          id: `emergency_${Date.now()}`,
          name: 'Paciente Emergência',
          age: 45,
          type: 'adult',
          consultationType: 'presential',
          appointmentType: 'emergency',
          scheduledTime: now,
          estimatedDuration: 30,
          priority: 'emergency',
          status: 'waiting',
          notes: 'Dor no peito aguda'
        };
        
        setPatients(prev => [emergency, ...prev]);
        eventMessage = `🚨 Emergência inserida: ${emergency.name}`;
        break;

      case 'arrival':
        const nextPatient = patients.find(p => p.status === 'scheduled');
        if (nextPatient) {
          setPatients(prev => prev.map(p => 
            p.id === nextPatient.id ? { ...p, status: 'waiting' } : p
          ));
          eventMessage = `✅ Paciente chegou: ${nextPatient.name}`;
        }
        break;

      case 'delay':
        const randomPatient = patients[Math.floor(Math.random() * patients.length)];
        if (randomPatient && randomPatient.status === 'scheduled') {
          const newTime = new Date(randomPatient.scheduledTime.getTime() + 15 * 60 * 1000);
          setPatients(prev => prev.map(p => 
            p.id === randomPatient.id ? { ...p, scheduledTime: newTime } : p
          ));
          eventMessage = `⏰ Atraso de 15min: ${randomPatient.name}`;
        }
        break;

      case 'noshow':
        const scheduledPatient = patients.find(p => p.status === 'scheduled');
        if (scheduledPatient) {
          setPatients(prev => prev.map(p => 
            p.id === scheduledPatient.id ? { ...p, status: 'no_show' } : p
          ));
          eventMessage = `❌ No-show: ${scheduledPatient.name}`;
        }
        break;

      case 'family_booking':
        const familyMembers: DemoPatient[] = [
          {
            id: `family_${Date.now()}_1`,
            name: 'Mãe da Família',
            age: 38,
            type: 'adult',
            familyGroup: 'nova_familia',
            consultationType: 'telemedicine',
            appointmentType: 'followup',
            scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
            estimatedDuration: 25,
            priority: 'normal',
            status: 'scheduled',
            notes: 'Consulta de rotina'
          },
          {
            id: `family_${Date.now()}_2`,
            name: 'Filho (10 anos)',
            age: 10,
            type: 'child',
            familyGroup: 'nova_familia',
            consultationType: 'telemedicine',
            appointmentType: 'initial',
            scheduledTime: new Date(now.getTime() + 2.5 * 60 * 60 * 1000),
            estimatedDuration: 30,
            priority: 'normal',
            status: 'scheduled',
            notes: 'Primeira consulta pediátrica'
          }
        ];
        
        setPatients(prev => [...prev, ...familyMembers]);
        eventMessage = `👨‍👩‍👧‍👦 Agendamento familiar: 2 consultas consecutivas`;
        break;
    }

    if (eventMessage) {
      setEvents(prev => [eventMessage, ...prev.slice(0, 9)]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in_consultation': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'no_show': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-red-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string, type: string) => {
    if (priority === 'emergency') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (type === 'child') return <Baby className="w-4 h-4 text-blue-500" />;
    if (type === 'elderly') return <Heart className="w-4 h-4 text-purple-500" />;
    return <Users className="w-4 h-4 text-gray-500" />;
  };

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Demo Realístico - Sistema de Agendamento
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Horário atual: {formatTime(currentTime)}
              </div>
              <Button
                onClick={() => setIsRunning(!isRunning)}
                variant={isRunning ? "destructive" : "default"}
                size="sm"
              >
                {isRunning ? "Pausar" : "Iniciar"} Simulação
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {doctors.map(doctor => (
              <Button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor.id)}
                variant={selectedDoctor === doctor.id ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">{doctor.avatar}</AvatarFallback>
                </Avatar>
                {doctor.name}
              </Button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => simulateEvent('emergency')} size="sm" variant="destructive">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Emergência
            </Button>
            <Button onClick={() => simulateEvent('arrival')} size="sm" variant="outline">
              <CheckCircle className="w-4 h-4 mr-1" />
              Chegada
            </Button>
            <Button onClick={() => simulateEvent('delay')} size="sm" variant="outline">
              <Timer className="w-4 h-4 mr-1" />
              Atraso
            </Button>
            <Button onClick={() => simulateEvent('noshow')} size="sm" variant="outline">
              <XCircle className="w-4 h-4 mr-1" />
              No-Show
            </Button>
            <Button onClick={() => simulateEvent('family_booking')} size="sm" variant="outline">
              <UserPlus className="w-4 h-4 mr-1" />
              Família
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Agenda do Médico</TabsTrigger>
          <TabsTrigger value="patients">Lista de Pacientes</TabsTrigger>
          <TabsTrigger value="events">Eventos em Tempo Real</TabsTrigger>
          <TabsTrigger value="analytics">Análise de Performance</TabsTrigger>
        </TabsList>

        {/* Agenda do Médico */}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações do Médico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  {selectedDoctorData?.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDoctorData?.specialty}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Horário:</span>
                  <span>{selectedDoctorData?.workingHours.start} - {selectedDoctorData?.workingHours.end}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge className={selectedDoctorData?.currentStatus === 'available' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {selectedDoctorData?.currentStatus === 'available' ? 'Disponível' : 'Ocupado'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Durações típicas:</div>
                  <div className="flex justify-between">
                    <span>Consulta inicial:</span>
                    <span>{selectedDoctorData?.consultationTypes.initial}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retorno:</span>
                    <span>{selectedDoctorData?.consultationTypes.followup}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teleconsulta:</span>
                    <span>{selectedDoctorData?.consultationTypes.telemedicine}min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline da Agenda */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Agenda de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {appointments
                  .filter(apt => apt.doctorId === selectedDoctor)
                  .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime())
                  .map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patientId);
                    if (!patient) return null;

                    return (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            {getPriorityIcon(patient.priority, patient.type)}
                            {appointment.type === 'telemedicine' ? 
                              <Video className="w-3 h-3 text-blue-500 mt-1" /> : 
                              <MapPin className="w-3 h-3 text-green-500 mt-1" />
                            }
                          </div>
                          <div>
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {patient.notes} • {patient.age} anos
                            </div>
                            {patient.familyGroup && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Família {patient.familyGroup}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatTime(appointment.scheduledStart)} - {formatTime(appointment.scheduledEnd)}
                          </div>
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status === 'scheduled' && 'Agendado'}
                            {patient.status === 'waiting' && 'Aguardando'}
                            {patient.status === 'in_consultation' && 'Em consulta'}
                            {patient.status === 'completed' && 'Concluído'}
                            {patient.status === 'no_show' && 'Faltou'}
                          </Badge>
                          {appointment.room && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {appointment.room}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lista de Pacientes */}
        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Todos os Pacientes ({patients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((patient) => (
                  <div key={patient.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(patient.priority, patient.type)}
                        <span className="font-medium">{patient.name}</span>
                      </div>
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.priority === 'emergency' ? 'EMERGÊNCIA' : patient.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Idade:</span>
                        <span>{patient.age} anos</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <div className="flex items-center gap-1">
                          {patient.consultationType === 'telemedicine' ? 
                            <Video className="w-3 h-3" /> : 
                            <MapPin className="w-3 h-3" />
                          }
                          <span>{patient.consultationType === 'telemedicine' ? 'Teleconsulta' : 'Presencial'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Horário:</span>
                        <span>{formatTime(patient.scheduledTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duração:</span>
                        <span>{patient.estimatedDuration}min</span>
                      </div>
                    </div>
                    
                    {patient.notes && (
                      <p className="text-xs text-muted-foreground border-t pt-2">
                        {patient.notes}
                      </p>
                    )}
                    
                    {patient.familyGroup && (
                      <Badge variant="outline" className="text-xs">
                        Grupo: {patient.familyGroup}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eventos em Tempo Real */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Log de Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span>{event}</span>
                    <span className="text-muted-foreground">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum evento registrado ainda. Use os botões acima para simular eventos.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise de Performance */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {patients.filter(p => p.status === 'scheduled').length}
                </div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.status === 'completed').length}
                </div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {patients.filter(p => p.status === 'waiting').length}
                </div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {patients.filter(p => p.status === 'no_show').length}
                </div>
                <p className="text-sm text-muted-foreground">No-Shows</p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Modalidade</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Teleconsultas
                      </span>
                      <span>{patients.filter(p => p.consultationType === 'telemedicine').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Presenciais
                      </span>
                      <span>{patients.filter(p => p.consultationType === 'presential').length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Prioridade</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Emergência
                      </span>
                      <span>{patients.filter(p => p.priority === 'emergency').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        Normal
                      </span>
                      <span>{patients.filter(p => p.priority === 'normal').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TelemedicineSchedulerDemo;