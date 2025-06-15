
import { Calendar, Clock, MapPin, Phone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UpcomingAppointments = () => {
  const appointments = [
    {
      id: 1,
      doctor: "Dr. Ana Silva",
      specialty: "Cardiologista",
      date: "Amanhã",
      time: "14:30",
      location: "Hospital São Lucas",
      type: "Consulta",
      status: "confirmada",
      avatar: "AS"
    },
    {
      id: 2,
      doctor: "Dr. João Santos",
      specialty: "Dermatologista",
      date: "Sexta-feira",
      time: "09:00",
      location: "Clínica Bella Vista",
      type: "Retorno",
      status: "pendente",
      avatar: "JS"
    },
    {
      id: 3,
      doctor: "Dra. Maria Costa",
      specialty: "Nutricionista",
      date: "Segunda-feira",
      time: "16:00",
      location: "Telemedicina",
      type: "Online",
      status: "confirmada",
      avatar: "MC"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-700';
      case 'pendente': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmada': return 'Confirmada';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-5 w-5" />
            Próximas Consultas
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600">
            Ver todas
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100 hover:shadow-md transition-all"
          >
            {/* Avatar */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
              {appointment.avatar}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {appointment.doctor}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {appointment.specialty}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{appointment.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{appointment.time}</span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  {appointment.type === 'Online' ? (
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="truncate text-xs sm:text-sm">{appointment.location}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <Badge className={`${getStatusColor(appointment.status)} border-0 text-xs`}>
                  {getStatusText(appointment.status)}
                </Badge>
                <div className="flex gap-2 w-full sm:w-auto">
                  {appointment.status === 'pendente' && (
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs flex-1 sm:flex-none">
                      Confirmar
                    </Button>
                  )}
                  <Button size="sm" className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600 flex-1 sm:flex-none">
                    {appointment.type === 'Online' ? 'Entrar' : 'Detalhes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;
