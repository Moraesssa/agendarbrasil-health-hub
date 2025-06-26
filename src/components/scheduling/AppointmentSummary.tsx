
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Stethoscope, User, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

// Sub-componente para evitar repetição
const InfoRow = ({ 
  icon: Icon, 
  label, 
  value, 
  isCompleted = false 
}: { 
  icon: React.ElementType, 
  label: string, 
  value: string | null,
  isCompleted?: boolean 
}) => (
  <div className="flex items-start py-4 border-b border-gray-100 last:border-b-0 min-h-[70px] group hover:bg-gray-50/50 transition-colors duration-200 rounded-lg px-2 -mx-2">
    <div className="relative mr-4 mt-1">
      <Icon className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'} transition-colors duration-200`} />
      {isCompleted && (
        <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
      )}
    </div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words leading-relaxed">
        {value ? (
          <span className={isCompleted ? 'text-green-700' : 'text-gray-800'}>{value}</span>
        ) : (
          <span className="text-gray-400 italic">Aguardando seleção...</span>
        )}
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

  const locationText = selectedState && selectedCity ? `${selectedCity}, ${selectedState}` : null;

  // Calcular progresso
  const fields = [selectedSpecialty, locationText, selectedDoctorName, formattedDate, selectedTime];
  const completedFields = fields.filter(Boolean).length;
  const isComplete = completedFields === fields.length;

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Resumo do Agendamento
        </CardTitle>
        <p className="text-blue-100 text-sm mt-1">
          {completedFields}/5 informações preenchidas
        </p>
        
        {/* Barra de Progresso Interna */}
        <div className="w-full bg-white/20 rounded-full h-2 mt-3">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(completedFields / 5) * 100}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1 p-6">
        <InfoRow 
          icon={Stethoscope} 
          label="Especialidade" 
          value={selectedSpecialty}
          isCompleted={!!selectedSpecialty}
        />
        <InfoRow 
          icon={MapPin} 
          label="Localização" 
          value={locationText}
          isCompleted={!!locationText}
        />
        <InfoRow 
          icon={User} 
          label="Profissional" 
          value={selectedDoctorName}
          isCompleted={!!selectedDoctorName}
        />
        <InfoRow 
          icon={Calendar} 
          label="Data" 
          value={formattedDate}
          isCompleted={!!formattedDate}
        />
        <InfoRow 
          icon={Clock} 
          label="Horário" 
          value={selectedTime ? `${selectedTime}` : null}
          isCompleted={!!selectedTime}
        />
        
        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Pronto para agendar!</span>
            </div>
            <p className="text-green-600 text-xs mt-1">
              Todas as informações foram preenchidas. Você pode confirmar o agendamento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
