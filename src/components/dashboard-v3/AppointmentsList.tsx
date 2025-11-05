import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Video, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { useDashboardAppointments } from '@/hooks/dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

/**
 * AppointmentsList Component
 * 
 * Shows upcoming appointments for today
 */
export const AppointmentsList: React.FC = () => {
  const { data: appointments, isLoading, error } = useDashboardAppointments(5);
  const navigate = useNavigate();

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-gray-800">Próximas Consultas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-600 text-sm">Erro ao carregar consultas</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-gray-800">Próximas Consultas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          Próximas Consultas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!appointments || appointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma consulta agendada para hoje</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentItem key={appointment.id} appointment={appointment} />
            ))}
            
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/gerenciar-agenda')}
            >
              Ver Agenda Completa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AppointmentItemProps {
  appointment: {
    id: string;
    patientName: string;
    patientAvatar?: string;
    scheduledTime: Date;
    type: 'presencial' | 'teleconsulta';
    status: 'confirmed' | 'pending' | 'agendada';
    isUrgent: boolean;
  };
}

const AppointmentItem: React.FC<AppointmentItemProps> = ({ appointment }) => {
  const timeStr = format(appointment.scheduledTime, 'HH:mm', { locale: ptBR });
  const isConfirmed = appointment.status === 'confirmed';

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
      appointment.isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Avatar */}
      <div className="relative">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-lg font-semibold text-blue-600">
            {appointment.patientName.charAt(0).toUpperCase()}
          </span>
        </div>
        {appointment.isUrgent && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{appointment.patientName}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="h-3.5 w-3.5" />
            {timeStr}
          </span>
          <Badge variant={isConfirmed ? 'default' : 'secondary'} className="text-xs">
            {isConfirmed ? 'Confirmada' : 'Pendente'}
          </Badge>
        </div>
      </div>

      {/* Type Icon */}
      <div className={`p-2 rounded-lg ${
        appointment.type === 'teleconsulta' ? 'bg-green-100' : 'bg-blue-100'
      }`}>
        {appointment.type === 'teleconsulta' ? (
          <Video className="h-5 w-5 text-green-600" />
        ) : (
          <MapPin className="h-5 w-5 text-blue-600" />
        )}
      </div>
    </div>
  );
};
