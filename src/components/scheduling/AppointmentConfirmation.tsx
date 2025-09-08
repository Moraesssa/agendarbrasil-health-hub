/**
 * Componente de Confirmação de Agendamento
 * Mostra detalhes da consulta agendada e próximos passos
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  Mail,
  Plus,
  Eye,
  Download,
  Bell
} from 'lucide-react';

import SchedulingService, { Appointment } from '@/services/schedulingService';
import { toast } from '@/components/ui/use-toast';

interface AppointmentConfirmationProps {
  appointmentId: string;
  onNewAppointment: () => void;
  onViewAppointments: () => void;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  appointmentId,
  onNewAppointment,
  onViewAppointments
}) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointmentDetails();
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      // Aqui você faria a busca dos detalhes da consulta
      // Por enquanto, vamos simular os dados
      
      // const appointmentDetails = await SchedulingService.getAppointmentById(appointmentId);
      // setAppointment(appointmentDetails);
      
      // Dados simulados para demonstração
      const mockAppointment: Appointment = {
        id: appointmentId,
        medico_id: 'dr1',
        paciente_id: 'p1',
        data_hora_agendada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
        duracao_estimada: 30,
        tipo: 'teleconsulta',
        prioridade: 'normal',
        status: 'agendada',
        valor_consulta: 150,
        motivo_consulta: 'Consulta de rotina',
        buffer_antes: 5,
        buffer_depois: 5,
        permite_reagendamento: true,
        agendado_por: 'p1',
        medico: {
          id: 'dr1',
          usuario_id: 'u1',
          nome: 'Dr. Carlos Silva',
          email: 'carlos.silva@email.com',
          crm: '12345',
          uf_crm: 'SP',
          especialidade: 'Cardiologia',
          bio_perfil: 'Especialista em cardiologia com 15 anos de experiência',
          valor_consulta_presencial: 200,
          valor_consulta_teleconsulta: 150,
          duracao_consulta_padrao: 30,
          duracao_consulta_inicial: 45,
          duracao_teleconsulta: 25,
          aceita_teleconsulta: true,
          aceita_consulta_presencial: true,
          rating: 4.8,
          total_avaliacoes: 127
        }
      };
      
      setAppointment(mockAppointment);
    } catch (error) {
      console.error('Erro ao carregar detalhes da consulta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da consulta.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const handleAddToCalendar = () => {
    if (!appointment) return;

    const startDate = new Date(appointment.data_hora_agendada);
    const endDate = new Date(startDate.getTime() + appointment.duracao_estimada * 60000);
    
    const title = `Consulta - ${appointment.medico?.nome}`;
    const details = `Consulta ${appointment.tipo} com ${appointment.medico?.nome}\nMotivo: ${appointment.motivo_consulta}`;
    
    // Criar link para Google Calendar
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(details)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleDownloadReceipt = () => {
    toast({
      title: "Comprovante",
      description: "O comprovante será enviado por email em breve.",
    });
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando detalhes da consulta...</p>
        </CardContent>
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Erro ao carregar os detalhes da consulta.</p>
          <Button onClick={onNewAppointment} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Confirmação Principal */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Consulta Agendada com Sucesso!
          </h2>
          <p className="text-green-700">
            Sua consulta foi confirmada e você receberá lembretes por email e SMS.
          </p>
        </CardContent>
      </Card>

      {/* Detalhes da Consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Detalhes da Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Médico */}
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <Avatar className="w-16 h-16">
              <AvatarImage src={appointment.medico?.foto_perfil_url} />
              <AvatarFallback>
                {appointment.medico?.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{appointment.medico?.nome}</h3>
              <p className="text-muted-foreground">{appointment.medico?.especialidade}</p>
              <p className="text-sm text-muted-foreground">CRM: {appointment.medico?.crm}/{appointment.medico?.uf_crm}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-sm ${
                    i < Math.floor(appointment.medico?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                  }`}>
                    ★
                  </span>
                ))}
                <span className="text-sm text-muted-foreground ml-1">
                  ({appointment.medico?.total_avaliacoes} avaliações)
                </span>
              </div>
            </div>
          </div>

          {/* Informações da Consulta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Data</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(appointment.data_hora_agendada)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Horário</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(appointment.data_hora_agendada)} ({appointment.duracao_estimada} minutos)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {appointment.tipo === 'teleconsulta' ? (
                  <Video className="w-5 h-5 text-blue-500" />
                ) : (
                  <MapPin className="w-5 h-5 text-blue-500" />
                )}
                <div>
                  <p className="font-medium">Tipo de Consulta</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {appointment.tipo}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Motivo da Consulta</p>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {appointment.motivo_consulta}
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">Valor</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(appointment.valor_consulta)}
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">Status</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {appointment.status === 'agendada' ? 'Agendada' : appointment.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Confirmação por Email</p>
                <p className="text-sm text-muted-foreground">
                  Você receberá um email com todos os detalhes da consulta em alguns minutos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Lembretes Automáticos</p>
                <p className="text-sm text-muted-foreground">
                  Enviaremos lembretes 24h e 2h antes da consulta por email e SMS.
                </p>
              </div>
            </div>

            {appointment.tipo === 'teleconsulta' && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Video className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Link da Teleconsulta</p>
                  <p className="text-sm text-muted-foreground">
                    O link para a videochamada será enviado por email 30 minutos antes da consulta.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={handleAddToCalendar} variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Adicionar à Agenda
        </Button>

        <Button onClick={handleDownloadReceipt} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Baixar Comprovante
        </Button>

        <Button onClick={onViewAppointments} variant="outline" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Ver Minhas Consultas
        </Button>

        <Button onClick={onNewAppointment} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Consulta
        </Button>
      </div>
    </div>
  );
};

export default AppointmentConfirmation;