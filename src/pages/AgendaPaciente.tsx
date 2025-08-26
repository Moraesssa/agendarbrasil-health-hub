
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Calendar, Clock, MapPin, User, Filter } from 'lucide-react';
import { useConsultas } from '@/hooks/useConsultas';
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/contexts/AuthContext';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import AppointmentSkeleton from '@/components/appointments/AppointmentSkeleton';
import EmptyStateCard from '@/components/appointments/EmptyStateCard';
import ErrorCard from '@/components/appointments/ErrorCard';
import { RescheduleDialog } from '@/components/scheduling/RescheduleDialog';
import { WaitingListDialog } from '@/components/scheduling/WaitingListDialog';
import { ConsultasStatusFilter } from '@/components/dashboard/ConsultasStatusFilter';

type AppointmentStatus = 'agendada' | 'confirmada' | 'cancelada' | 'realizada' | 'pendente';

const AgendaPaciente = () => {
  const { user } = useAuth();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showPastAppointments, setShowPastAppointments] = useState(false);

  // Stabilize filters object to prevent infinite re-renders
  const filters = useMemo(() => ({
    status: selectedStatuses.length > 0 ? selectedStatuses as AppointmentStatus[] : undefined,
    futureOnly: !showPastAppointments
  }), [selectedStatuses, showPastAppointments]);

  const { consultas, loading, error, refetch } = useConsultas(filters);
  const { checkPendingPayments } = usePayment();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faça login para ver suas consultas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Minhas Consultas</h1>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorCard 
          message={error} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Minhas Consultas</h1>
        
        <div className="flex flex-wrap gap-2">
          <ConsultasStatusFilter
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
          />
          <Button
            variant={showPastAppointments ? "default" : "outline"}
            onClick={() => setShowPastAppointments(!showPastAppointments)}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showPastAppointments ? 'Ocultar Antigas' : 'Mostrar Antigas'}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              // Disparar evento global para verificação (PaymentStatusChecker escuta isso)
              window.dispatchEvent(new Event('checkPaymentRequested'));
              try {
                await checkPendingPayments();
              } catch (e) {
                // ignore - usePayment já loga/mostra toast
              }
            }}
            size="sm"
          >
            Verificar Pagamento
          </Button>
        </div>
      </div>

      {consultas.length === 0 ? (
        <EmptyStateCard 
          message="Nenhuma consulta encontrada"
          description="Você ainda não tem consultas agendadas ou não há consultas que correspondam aos filtros selecionados."
          onSchedule={() => window.location.href = '/agendamento'}
        />
      ) : (
        <div className="grid gap-6">
          {consultas.map((consulta) => {
            const appointmentDate = new Date(consulta.consultation_date || '');
            const isPast = appointmentDate < new Date();
            
            return (
              <Card key={consulta.id} className={isPast ? 'opacity-75' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Dr. {consulta.doctor_profile?.display_name || 'Médico'}
                      </CardTitle>
                      <Badge variant={
                        consulta.status === 'agendada' ? 'secondary' :
                        consulta.status === 'confirmada' ? 'default' :
                        consulta.status === 'realizada' ? 'secondary' :
                        'destructive'
                      }>
                        {consulta.status === 'agendada' ? 'Agendada' :
                         consulta.status === 'confirmada' ? 'Confirmada' :
                         consulta.status === 'realizada' ? 'Realizada' :
                         consulta.status === 'cancelada' ? 'Cancelada' : consulta.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{appointmentDate.toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{consulta.consultation_type || 'Consulta Médica'}</span>
                    {consulta.notes && (
                      <span className="text-muted-foreground">• {consulta.notes}</span>
                    )}
                  </div>

                  {consulta.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{consulta.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!isPast && consulta.status === 'agendada' && (
                      <RescheduleDialog
                        appointmentId={consulta.id}
                        currentDateTime={consulta.consultation_date || ''}
                        onReschedule={refetch}
                      >
                        <Button variant="outline" size="sm">
                          Reagendar
                        </Button>
                      </RescheduleDialog>
                    )}

                    {isPast && consulta.status === 'cancelada' && (
                      <WaitingListDialog
                        medicoId={consulta.medico_id || ''}
                        medicoNome={consulta.doctor_profile?.display_name || 'Médico'}
                        especialidade={consulta.consultation_type || ''}
                        trigger={
                          <Button variant="outline" size="sm">
                            Entrar na Lista de Espera
                          </Button>
                        }
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgendaPaciente;
