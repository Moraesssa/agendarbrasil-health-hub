/**
 * Agenda do Paciente — "Minhas Consultas"
 * Versão de produção: dados reais via useConsultas + cancelamento real.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useConsultas, type ConsultaWithDoctor } from '@/hooks/useConsultas';

const STATUS_LABEL: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
};

const AgendaPacienteIntegrada: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { consultas, loading, cancelConsulta, refetch } = useConsultas();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (confirmCancelId == null) return;
    setCancelling(true);
    const result = await cancelConsulta(confirmCancelId);
    setCancelling(false);
    setConfirmCancelId(null);

    if (result.success) {
      toast({
        title: 'Consulta cancelada',
        description: 'Sua consulta foi cancelada com sucesso.',
      });
      refetch();
    } else {
      toast({
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar a consulta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleReschedule = () => {
    toast({
      title: 'Reagendar consulta',
      description: 'Cancele esta consulta e agende uma nova com o mesmo médico.',
    });
    navigate('/agendamento');
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'confirmada':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'agendada':
      case 'pendente':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'realizada':
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'agendada':
      case 'pendente':
        return 'bg-blue-100 text-blue-800';
      case 'realizada':
        return 'bg-muted text-muted-foreground';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const filterAppointments = (items: ConsultaWithDoctor[]) => {
    const now = new Date();
    switch (activeTab) {
      case 'upcoming':
        return items.filter(
          (c) =>
            new Date(c.consultation_date) > now &&
            c.status !== 'cancelada' &&
            c.status !== 'realizada',
        );
      case 'past':
        return items.filter(
          (c) =>
            (new Date(c.consultation_date) < now && c.status !== 'cancelada') ||
            c.status === 'realizada',
        );
      case 'cancelled':
        return items.filter((c) => c.status === 'cancelada');
      default:
        return items;
    }
  };

  const filtered = filterAppointments(consultas);

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

  const isTeleconsulta = (c: ConsultaWithDoctor) =>
    (c.consultation_type || '').toLowerCase() === 'online' ||
    (c.consultation_type || '').toLowerCase() === 'teleconsulta';

  const initials = (name?: string | null) =>
    (name || 'M')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Consultas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus agendamentos e histórico médico
          </p>
        </div>

        <Button onClick={() => navigate('/agendamento')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Consulta
        </Button>
      </div>

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
                        <div className="w-12 h-12 bg-muted rounded-full" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-1/4" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma consulta encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
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
              {filtered.map((c) => {
                const tele = isTeleconsulta(c);
                const isUpcoming =
                  new Date(c.consultation_date) > new Date() &&
                  c.status !== 'cancelada' &&
                  c.status !== 'realizada';

                return (
                  <Card key={c.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-16 h-16">
                            <AvatarFallback>
                              {initials(c.doctor_profile?.display_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {c.doctor_profile?.display_name || 'Médico'}
                                </h3>
                                {c.doctor_profile?.especialidades?.length ? (
                                  <p className="text-muted-foreground">
                                    {c.doctor_profile.especialidades.join(', ')}
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-2">
                                {getStatusIcon(c.status)}
                                <Badge className={getStatusColor(c.status)}>
                                  {STATUS_LABEL[c.status || ''] || c.status || 'Agendada'}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(c.consultation_date)}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{formatTime(c.consultation_date)}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {tele ? (
                                  <Video className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">
                                  {tele ? 'Teleconsulta' : c.local_consulta || 'Presencial'}
                                </span>
                              </div>

                              {c.status_pagamento && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Pagamento:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {c.status_pagamento}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {c.notes && (
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-1">Observações:</p>
                                <p className="text-sm text-muted-foreground">{c.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:min-w-[200px]">
                          {c.status === 'confirmada' && tele && (
                            <Button
                              className="w-full"
                              onClick={() => navigate('/telemedicina')}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Entrar na Consulta
                            </Button>
                          )}

                          {isUpcoming && (
                            <>
                              <Button
                                variant="outline"
                                onClick={handleReschedule}
                                className="w-full"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Reagendar
                              </Button>

                              <Button
                                variant="outline"
                                onClick={() => setConfirmCancelId(c.id)}
                                className="w-full text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={confirmCancelId !== null}
        onOpenChange={(open) => !open && setConfirmCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Caso já tenha pago, o reembolso seguirá a política
              da clínica.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgendaPacienteIntegrada;
