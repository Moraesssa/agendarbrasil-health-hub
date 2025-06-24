
import { Calendar, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppointmentSummaryProps {
  selectedSpecialty: string;
  selectedDoctorName: string | undefined;
  selectedDate: string;
  selectedTime: string;
}

export const AppointmentSummary = ({ 
  selectedSpecialty, 
  selectedDoctorName, 
  selectedDate, 
  selectedTime 
}: AppointmentSummaryProps) => {
  if (!selectedSpecialty || !selectedDoctorName || !selectedDate || !selectedTime) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Resumo do Agendamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <User className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium">Especialidade</p>
            <p className="text-sm text-gray-600">{selectedSpecialty}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          <User className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">Médico</p>
            <p className="text-sm text-gray-600">{selectedDoctorName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
          <Calendar className="h-5 w-5 text-orange-600" />
          <div>
            <p className="font-medium">Data</p>
            <p className="text-sm text-gray-600">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
          <Clock className="h-5 w-5 text-purple-600" />
          <div>
            <p className="font-medium">Horário</p>
            <p className="text-sm text-gray-600">{selectedTime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
