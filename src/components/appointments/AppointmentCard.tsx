import { Calendar, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import LocationMapModal from "@/components/map/LocationMapModal";
import { useLocationData } from "@/hooks/useLocationData";
import { useToast } from "@/hooks/use-toast";

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
}

const AppointmentCard = ({ 
  appointment, 
  onConfirm, 
  onViewDetails, 
  onGetDirections 
}: AppointmentCardProps) => {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const { fetchLocationById, loading: loadingLocation } = useLocationData();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-700 border-green-200';
      case 'agendada':
      case 'pendente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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

  const handleGetDirections = async (appointment: AppointmentWithDoctor) => {
    if (appointment.tipo_consulta === 'Online') {
      toast({
        title: "Consulta online",
        description: "Esta é uma consulta por telemedicina. Não há localização física.",
      });
      return;
    }

    if (!appointment.local_id) {
      toast({
        title: "Local não encontrado",
        description: "Não foi possível encontrar os dados de localização desta consulta.",
        variant: "destructive",
      });
      return;
    }

    try {
      const location = await fetchLocationById(appointment.local_id);
      if (location) {
        setLocationData(location);
        setIsMapModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao abrir mapa:', error);
      toast({
        title: "Erro ao abrir mapa",
        description: "Não foi possível carregar os dados de localização.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100 hover:shadow-md transition-all">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
          {appointment.doctor_profile?.display_name?.split(' ').map(n => n[0]).join('') || 'Dr'}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            {appointment.doctor_profile?.display_name || "Médico"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            {appointment.tipo_consulta}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 my-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{new Date(appointment.data_consulta).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{new Date(appointment.data_consulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <Badge className={`${getStatusColor(appointment.status)} border text-xs`}>
              {getStatusText(appointment.status)}
            </Badge>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              {appointment.status === 'agendada' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2 text-xs flex-1 sm:flex-none border-green-200 hover:bg-green-50"
                  onClick={() => onConfirm(appointment.id)}
                >
                  Confirmar
                </Button>
              )}
              {appointment.tipo_consulta !== 'Online' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2 text-xs flex-1 sm:flex-none"
                  onClick={() => handleGetDirections(appointment)}
                  disabled={loadingLocation}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {loadingLocation ? "..." : "Mapa"}
                </Button>
              )}
              <Button 
                size="sm" 
                className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600 flex-1 sm:flex-none"
                onClick={() => onViewDetails(appointment)}
              >
                Detalhes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      <LocationMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        location={locationData}
        appointmentDate={appointment.data_consulta}
        appointmentTime={new Date(appointment.data_consulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        doctorName={appointment.doctor_profile?.display_name || "Médico"}
      />
    </>
  );
};

export default AppointmentCard;
