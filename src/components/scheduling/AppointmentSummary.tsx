import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Stethoscope, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

// Sub-componente para evitar repetição
const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => (
  <div className="flex items-start py-3 border-b border-gray-100 last:border-b-0 min-h-[60px]">
    <Icon className="h-5 w-5 text-blue-500 mt-1 mr-4 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-md font-medium text-gray-800 break-words">
        {value || <span className="text-gray-400 italic">Aguardando seleção...</span>}
      </p>
    </div>
  </div>
);

// Tipagem para as props do componente principal
interface AppointmentSummaryProps {
    selectedSpecialty: string;
    selectedDoctorName: string;
    selectedState: string;
    selectedCity: string;
    selectedDate: string;
    selectedTime: string;
}

export const AppointmentSummary = ({ 
    selectedSpecialty, 
    selectedDoctorName, 
    selectedState, 
    selectedCity, 
    selectedDate, 
    selectedTime 
}: AppointmentSummaryProps) => {

  // Formata a data de forma mais elegante
  const formattedDate = selectedDate 
    ? format(new Date(selectedDate.replace(/-/g, '/')), "EEEE, dd 'de' MMMM", { locale: ptBR }) 
    : null;

  return (
    <Card className="shadow-lg border-gray-200 rounded-xl sticky top-24">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-700">Resumo do Agendamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 md:p-6">
        <InfoRow icon={Stethoscope} label="Especialidade" value={selectedSpecialty} />
        <InfoRow icon={MapPin} label="Localização" value={selectedState && selectedCity ? `${selectedCity}, ${selectedState}` : null} />
        <InfoRow icon={User} label="Profissional" value={selectedDoctorName} />
        <InfoRow icon={Calendar} label="Data" value={formattedDate} />
        <InfoRow icon={Clock} label="Horário" value={selectedTime ? `${selectedTime}` : null} />
      </CardContent>
    </Card>
  );
};
