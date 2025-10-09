/**
 * Agenda do Paciente Integrada
 * Nova versão com sistema de agendamento otimizado
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Plus,
  Filter,
  Search,
  Phone,
  MessageCircle,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SchedulingService, { Appointment } from '@/services/schedulingService';
import { toast } from '@/components/ui/use-toast';

const AgendaPacienteIntegrada: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, activeTab]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Por enquanto, vamos usar dados simulados
      // const userAppointments = await SchedulingService.getPatientAppointments(user.id);
      
      // Dados simulados para demonstração
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          medico_id: 'dr1',
          paciente_id: user.id,
          data_hora_agendada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
          duracao_estimada: 30,
          tipo: 'teleconsulta',
          prioridade: 'normal',
          status: 'confirmada',
          valor_consulta: 150,
          motivo_consulta: 'Consulta de rotina - acompanhamento',
          buffer_antes: 5,
          buffer_depois: 5,
          permite_reagendamento: true,
          agendado_por: user.id,
          medico: {
            id: 'dr1',
            user_id: 'u1',
            nome: 'Dr. Carlos Silva',
            email: 'carlos.silva@email.com',
            crm: '12345',
            uf_crm: 'SP',
            especialidade: 'Cardiologia',
            valor_consulta_presencial: 200,
            valor_consulta_teleconsulta: 150,
            duracao_consulta_padrao: 30,
            aceita_teleconsulta: true,
            aceita_consulta_presencial: true,
            rating: 4.8,
            total_avaliacoes: 127
          }
        },
        {
          id: '2',
          medico_id: 'dr2',
          paciente_id: user.id,
          data_hora_agendada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Próxima semana
          duracao_estimada: 45,
          tipo: 'presencial',
          prioridade: 'alta',
          status: 'agendada',
          valor_consulta: 200,
          motivo_consulta: 'Primeira consulta - avaliação geral',
          buffer_antes: 10,
          buffer_depois: 5,
          permite_reagendamento: true,
          agendado_por: user.id,
          medico: {
            id: 'dr2',
            user_id: 'u2',
            nome: 'Dra. Ana Santos',
            email: 'ana.santos@email.com',
            crm: '67890',
            uf_crm: 'RJ',
            especialidade: 'Pediatria',
            valor_consulta_presencial: 200,
            valor_consulta_teleconsulta: 150,
            duracao_consulta_padrao: 30,
            aceita_teleconsulta: true,
            aceita_consulta_presencial: true,
            rating: 4.9,
            total_avaliacoes: 89
          }
        },
        {
          id: '3',
          medico_id: 'dr1',
          paciente_id: user.id,
          data_hora_agendada: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Semana passada
          duracao_estimada: 30,
          duracao_real: 35,
          tipo: 'teleconsulta',
          prioridade: 'normal',
          status: 'realizada',
          valor_consulta: 150,
          motivo_consulta: 'Retorno - resultados de exames',
          observacoes_medico: 'Paciente apresentou melhora significativa. Manter medicação atual.',
          buffer_antes: 5,
          buffer_depois: 5,
          permite_reagendamento: false,
          agendado_por: user.id,
          medico: {
            id: 'dr1',
            user_id: 'u1',
            nome: 'Dr. Carlos Silva',
            email: 'carlos.silva@email.com',
            crm: '12345',
            uf_crm: 'SP',
            especialidade: 'Cardiologia',
            valor_consulta_presencial: 200,
            valor_consulta_teleconsulta: 150,
            duracao_consulta_padrao: 30,
            aceita_teleconsulta: true,
            aceita_consulta_presencial: true,
            rating: 4.8,
            total_avaliacoes: 127
          }
        }
      ];

      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas consultas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId: string) => {
    try {
      // Implementar reagendamento
      toast({
        title: "Reagendamento",
        description: "Funcionalidade de reagendamento será implementada em breve.",
      });
    } catch (error) {
      console.error('Erro ao reagendar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reagendar a consulta.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      // Implementar cancelamento
      toast({
        title: "Cancelamento",
        description: "Funcionalidade de cancelamento será implementada em breve.",
      });
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a consulta.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmada':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'agendada':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'realizada':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'agendada':
        return 'bg-blue-100 text-blue-800';
      case 'realizada':
        return 'bg-gray-100 text-gray-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'Gratuito';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const filterAppointments = (appointments: Appointment[]) => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return appointments.filter(apt => 
          new Date(apt.data_hora_agendada) > now && 
          apt.status !== 'cancelada'
        );
      case 'past':
        return appointments.filter(apt => 
          new Date(apt.data_hora_agendada) < now || 
          apt.status === 'realizada'
        );
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelada');
      default:
        return appointments;
    }
  };

  const filteredAppointments = filterAppointments(appointments);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faça login para ver suas consultas</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Consultas</h1>
          <p className="text-gray-600 mt-1">Gerencie seus agendamentos e histórico médico</p>
        </div>
        
        <Button onClick={() => navigate('/agendamento')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Consulta
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Histórico</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma consulta encontrada
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'upcoming' && 'Você não tem consultas agendadas.'}
                  {activeTab === 'past' && 'Você ainda não realizou nenhuma consulta.'}
                  {activeTab === 'cancelled' && 'Você não tem consultas canceladas.'}
                </p>
                {activeTab === 'upcoming' && (
                  <Button onClick={() => navigate('/agendamento')}>
                    Agendar Primeira Consulta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Informações do Médico */}
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={appointment.medico?.foto_perfil_url} />
                          <AvatarFallback>
                            {appointment.medico?.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">{appointment.medico?.nome}</h3>
                              <p className="text-muted-foreground">{appointment.medico?.especialidade}</p>
                              <p className="text-sm text-muted-foreground">
                                CRM: {appointment.medico?.crm}/{appointment.medico?.uf_crm}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getStatusIcon(appointment.status)}
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status === 'agendada' && 'Agendada'}
                                {appointment.status === 'confirmada' && 'Confirmada'}
                                {appointment.status === 'realizada' && 'Realizada'}
                                {appointment.status === 'cancelada' && 'Cancelada'}
                              </Badge>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-3">
                            {renderStars(appointment.medico?.rating || 0)}
                            <span className="text-sm text-muted-foreground ml-1">
                              ({appointment.medico?.total_avaliacoes})
                            </span>
                          </div>

                          {/* Detalhes da Consulta */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(appointment.data_hora_agendada)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatTime(appointment.data_hora_agendada)} ({appointment.duracao_estimada}min)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {appointment.tipo === 'teleconsulta' ? (
                                <Video className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm capitalize">{appointment.tipo}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {formatCurrency(appointment.valor_consulta)}
                              </span>
                            </div>
                          </div>

                          {/* Motivo */}
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-1">Motivo:</p>
                            <p className="text-sm text-muted-foreground">{appointment.motivo_consulta}</p>
                          </div>

                          {/* Observações do médico (se houver) */}
                          {appointment.observacoes_medico && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium mb-1">Observações do médico:</p>
                              <p className="text-sm text-blue-800">{appointment.observacoes_medico}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {appointment.status === 'confirmada' && appointment.tipo === 'teleconsulta' && (
                          <Button className="w-full">
                            <Video className="w-4 h-4 mr-2" />
                            Entrar na Consulta
                          </Button>
                        )}
                        
                        {(appointment.status === 'agendada' || appointment.status === 'confirmada') && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => handleReschedule(appointment.id)}
                              className="w-full"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Reagendar
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              onClick={() => handleCancel(appointment.id)}
                              className="w-full text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </>
                        )}
                        
                        <Button variant="outline" className="w-full">
                          <Phone className="w-4 h-4 mr-2" />
                          Contatar Médico
                        </Button>
                        
                        {appointment.status === 'realizada' && (
                          <Button variant="outline" className="w-full">
                            <Star className="w-4 h-4 mr-2" />
                            Avaliar Consulta
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgendaPacienteIntegrada;