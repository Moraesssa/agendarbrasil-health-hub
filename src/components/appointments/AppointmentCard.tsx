

import { Calendar, Clock, Navigation, AlertCircle, Video, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { PaymentVerificationButton } from "@/components/PaymentVerificationButton";
import { PaymentStatusIndicator } from "@/components/PaymentStatusIndicator";

// Type for appointments with doctor info from profiles table
type AppointmentWithDoctor = Tables<'consultas'> & {
  doctor_profile: {
    display_name: string | null;
  } | null;
};

interface AppointmentCardProps {
  appointment: AppointmentWithDoctor;
  onConfirm: (appointmentId: string) => void;
  onViewDetails: (appointment: AppointmentWithDoctor) => void;
  onGetDirections: (appointment: AppointmentWithDoctor) => void;
  onStartVideoCall?: (appointment: AppointmentWithDoctor) => void;
}

const AppointmentCard = ({
  appointment,
  onConfirm,
  onViewDetails,
  onGetDirections,
  onStartVideoCall
}: AppointmentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-700 border-green-200';
      case 'agendada':
      case 'pendente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelada': return 'bg-red-100 text-red-700 border-red-200';
      case 'realizada': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'confirmada': 'Confirmada',
      'agendada': 'Agendada',
      'pendente': 'Pendente',
      'cancelada': 'Cancelada',
      'realizada': 'Realizada'
    };
    return statusMap[status] || status;
  };

  // Verifica se a consulta é passada
  const isPastAppointment = new Date(appointment.consultation_date) < new Date();
  const isCanceled = appointment.status === 'cancelada';
  const isCompleted = appointment.status === 'realizada';

  // Determina o estilo do card baseado no status
  const getCardStyle = () => {
    if (isCanceled) {
      return "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 opacity-90";
    }
    if (isPastAppointment || isCompleted) {
      return "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 opacity-90";
    }
    // Estilo especial para consultas online
    if (appointment.consultation_type === 'Online') {
      return "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:shadow-md transition-all";
    }
    return "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100 hover:shadow-md transition-all";
  };

  // Correção: Garante que doctorDisplayName seja sempre uma string
  const doctorDisplayName = appointment.doctor_profile?.display_name || "Médico";

  // Determina as ações disponíveis baseado no status e data
  const getAvailableActions = () => {
    const actions = [];
    
    // Sempre mostrar detalhes
    actions.push(
      <Button
        key="details"
        size="sm"
        className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600 flex-1 sm:flex-none"
        onClick={() => onViewDetails(appointment)}
      >
        Detalhes
      </Button>
    );

    // Verificar pagamento pendente
    if (appointment.status_pagamento === 'pendente') {
      actions.unshift(
        <PaymentVerificationButton 
          key="verify-payment"
          consultaId={appointment.id?.toString() || ''}
          onSuccess={() => {
            // Refresh local state instead of full page reload
            window.dispatchEvent(new CustomEvent('consultaUpdated'));
          }}
        />
      );
    }

    // Só mostrar ações específicas para consultas pagas, não canceladas e futuras
    if (!isCanceled && !isPastAppointment && !isCompleted && appointment.status_pagamento === 'pago') {
      if (appointment.status === 'agendada') {
        actions.unshift(
          <Button
            key="confirm"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs flex-1 sm:flex-none border-green-200 hover:bg-green-50"
            onClick={() => onConfirm(appointment.id?.toString() || '')}
          >
            Confirmar
          </Button>
        );
      }

      if (appointment.consultation_type === 'Online') {
        // Botão para videochamada
        actions.unshift(
          <Button
            key="video"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs flex-1 sm:flex-none border-green-200 hover:bg-green-50"
            onClick={() => onStartVideoCall?.(appointment)}
          >
            <Video className="h-3 w-3 mr-1" />
            Videochamada
          </Button>
        );
      } else {
        // Botão para direções (consultas presenciais)
        actions.unshift(
          <Button
            key="directions"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs flex-1 sm:flex-none"
            onClick={() => onGetDirections(appointment)}
          >
            <Navigation className="h-3 w-3 mr-1" />
            Mapa
          </Button>
        );
      }
    }

    return actions;
  };

  return (
    <div className={getCardStyle()}>
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
        {doctorDisplayName.split(' ').map(n => n[0]).join('') || 'Dr'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            {doctorDisplayName}
          </h3>
          {(isCanceled || isPastAppointment) && (
            <AlertCircle className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-xs sm:text-sm text-gray-600">
            {appointment.consultation_type}
          </p>
          {appointment.consultation_type === 'Online' && (
            <Video className="h-3 w-3 text-purple-600" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 my-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{new Date(appointment.consultation_date).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{new Date(appointment.consultation_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {isPastAppointment && !isCompleted && !isCanceled && (
            <span className="text-xs text-orange-600 font-medium">
              (Consulta passada)
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex gap-2 items-center flex-wrap">
            <Badge className={`${getStatusColor(appointment.status)} border text-xs`}>
              {getStatusText(appointment.status)}
            </Badge>
            <PaymentStatusIndicator 
              consultaId={appointment.id?.toString() || ''}
              statusPagamento={appointment.status_pagamento || 'pendente'}
              onStatusUpdate={() => {
                // Disparar evento para atualizar a lista
                window.dispatchEvent(new CustomEvent('consultaUpdated'));
              }}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {getAvailableActions()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;

