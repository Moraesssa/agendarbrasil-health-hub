/**
 * Agenda do Médico Integrada
 * Nova versão com sistema de agendamento otimizado
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Plus,
  Search,
  Filter,
  Phone,
  MessageCircle,
  User,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SchedulingService, { Appointment } from '@/services/schedulingService';
import { toast } from '@/components/ui/use-toast';

const AgendaMedicoIntegrada: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('agenda');

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, selectedDate]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Por enquanto, vamos usar dados simulados
      // const doctorAppointments = await SchedulingService.getDoctorAppointments(user.id, selectedDate);
      
      // Dados simulados para demonstração
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          medico_id: user.id,
          paciente_id: 'p1',
          data_hora_agendada: new Date(`${selectedDate}T09:00:00`).toISOString(),
          duracao_estimada: 30,
          tipo: 'presencial',
          prioridade: 'normal',
          status: 'confirmada',
          valor_consulta: 200,
          motivo_consulta: 'Consulta de rotina - hipertensão',
          buffer_antes: 5,
          buffer_depois: 5,
          permite_reagendamento: true,
          agendado_por: 'p1',
          paciente: {
            id: 'p1',
            usuario_id: 'u1',
            nome: 'Maria Silva',
            email: 'maria.silva@email.com',
            data_nascimento: '1980-05-15',
            telefone: '(11) 99999-9999'
          }
        },
        {
          id: '2',
          medico_id: user.id,
          paciente_id: 'p2',
          data_hora_agendada: new Date(`${selectedDate}T10:00:00`).toISOString(),
          duracao_estimada: 45,
          tipo: 'teleconsulta',
          prioridade: 'alta',
          status: 'agendada',
          valor_consulta: 150,
          motivo_consulta: 'Primeira consulta - dor no peito',
          buffer_antes: 10,
          buffer_depois: 5,
          permite_reagendamento: true,
          agendado_por: 'p2',
          paciente: {
            id: 'p2',
            usuario_id: 'u2',
            nome: 'João Santos',
            email: 'joao.santos@email.com',
            data_nascimento: '1975-08-22',
            telefone: '(11) 88888-8888'
          }
        },
        {
          id: '3',
          medico_id: user.id,
          paciente_id: 'p3',
          data_hora_agendada: new Date(`${selectedDate}T14:00:00`).toISOString(),
          duracao_estimada: 30,
          tipo: 'presencial',
          prioridade: 'normal',
          status: 'agendada',
          valor_consulta: 200,
          motivo_consulta: 'Retorno - resultados de exames',
          buffer_antes: 5,
          buffer_depois: 5,
          permite_reagendamento: true,
          agendado_por: 'p3',
          paciente: {
            id: 'p3',
            usuario_id: 'u3',
            nome: 'Ana Costa',
            email: 'ana.costa@email.com',
            data_nascimento: '1990-12-03',
            telefone: '(11) 77777-7777'
          }
        }
      ];

      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar sua agenda.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      // await SchedulingService.updateAppointmentStatus(appointmentId, newStatus);
      
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      
      toast({
        title: "Status atualizado",
        description: `Consulta marcada como ${newStatus}.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da consulta.",
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
      case 'em_andamento':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
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
      case 'em_andamento':
        return 'bg-orange-100 text-orange-800';
      case 'realizada':
        return 'bg-gray-100 text-gray-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayStats = {
    total: appointments.length,
    confirmadas: appointments.filter(apt => apt.status === 'confirmada').length,
    agendadas: appointments.filter(apt => apt.status === 'agendada').length,
    realizadas: appointments.filter(apt => apt.status === 'realizada').length,
    receita: appointments.reduce((sum, apt) => sum + (apt.valor_consulta || 0), 0)
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faça login para acessar sua agenda</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda Médica</h1>
          <p className="text-gray-600 mt-1">Gerencie suas consultas e horários</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/gerenciar-agenda')}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar Agenda
          </Button>
          <Button onClick={() => navigate('/agendamento')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agenda">Agenda do Dia</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        {/* Agenda do Dia */}
        <TabsContent value="agenda" className="space-y-6">
          {/* Controles de Data e Busca */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* Estatísticas do Dia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{todayStats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{todayStats.confirmadas}</div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{todayStats.agendadas}</div>
                <p className="text-sm text-muted-foreground">Agendadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{todayStats.realizadas}</div>
                <p className="text-sm text-muted-foreground">Realizadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(todayStats.receita)}</div>
                <p className="text-sm text-muted-foreground">Receita</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Consultas */}
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
                  {searchTerm ? 'Tente ajustar sua busca' : 'Não há consultas agendadas para esta data'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Informações do Paciente */}
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {appointment.paciente?.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">{appointment.paciente?.nome}</h3>
                              <p className="text-sm text-muted-foreground">{appointment.paciente?.telefone}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getStatusIcon(appointment.status)}
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status === 'agendada' && 'Agendada'}
                                {appointment.status === 'confirmada' && 'Confirmada'}
                                {appointment.status === 'em_andamento' && 'Em Andamento'}
                                {appointment.status === 'realizada' && 'Realizada'}
                                {appointment.status === 'cancelada' && 'Cancelada'}
                              </Badge>
                            </div>
                          </div>

                          {/* Detalhes da Consulta */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                              <span className="text-sm">
                                Prioridade: <span className="font-medium capitalize">{appointment.prioridade}</span>
                              </span>
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
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {appointment.status === 'agendada' && (
                          <Button 
                            onClick={() => handleStatusUpdate(appointment.id, 'confirmada')}
                            className="w-full"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar
                          </Button>
                        )}
                        
                        {appointment.status === 'confirmada' && (
                          <Button 
                            onClick={() => handleStatusUpdate(appointment.id, 'em_andamento')}
                            className="w-full"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Iniciar Consulta
                          </Button>
                        )}
                        
                        {appointment.status === 'em_andamento' && (
                          <Button 
                            onClick={() => handleStatusUpdate(appointment.id, 'realizada')}
                            className="w-full"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Finalizar
                          </Button>
                        )}
                        
                        <Button variant="outline" className="w-full">
                          <Phone className="w-4 h-4 mr-2" />
                          Contatar
                        </Button>
                        
                        <Button variant="outline" className="w-full">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Mensagem
                        </Button>
                        
                        {(appointment.status === 'agendada' || appointment.status === 'confirmada') && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleStatusUpdate(appointment.id, 'cancelada')}
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
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

        {/* Estatísticas */}
        <TabsContent value="estatisticas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estatísticas e Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de estatísticas será implementada em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="configuracoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações da Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de configurações será implementada em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgendaMedicoIntegrada;