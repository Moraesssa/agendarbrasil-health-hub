
import { Pill, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MedicationReminders = () => {
  const medications = [
    {
      id: 1,
      name: "Losartana 50mg",
      dosage: "1 comprimido",
      time: "08:00",
      status: "pendente",
      frequency: "Diário",
      nextDose: "em 2 horas"
    },
    {
      id: 2,
      name: "Vitamina D",
      dosage: "1 cápsula",
      time: "12:00",
      status: "tomado",
      frequency: "Diário",
      nextDose: "amanhã"
    },
    {
      id: 3,
      name: "Omega 3",
      dosage: "2 cápsulas",
      time: "20:00",
      status: "atrasado",
      frequency: "Diário",
      nextDose: "agora"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'tomado': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'atrasado': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'tomado': return 'bg-green-100 text-green-700';
      case 'atrasado': return 'bg-red-100 text-red-700';
      case 'pendente': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'tomado': return 'Tomado';
      case 'atrasado': return 'Atrasado';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
            <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
            Medicamentos
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
            Gerenciar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {medications.map((medication) => (
          <div
            key={medication.id}
            className={`p-3 sm:p-4 rounded-xl border transition-all ${
              medication.status === 'atrasado' 
                ? 'bg-red-50 border-red-200' 
                : medication.status === 'tomado'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="mt-1 flex-shrink-0">
                  {getStatusIcon(medication.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {medication.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {medication.dosage} • {medication.frequency}
                  </p>
                </div>
              </div>
              <Badge className={`${getStatusColor(medication.status)} border-0 text-xs flex-shrink-0 ml-2`}>
                {getStatusText(medication.status)}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{medication.time}</span>
                </div>
                <span className="text-xs sm:text-sm">Próxima: {medication.nextDose}</span>
              </div>
              <div className="w-full sm:w-auto">
                {medication.status === 'pendente' && (
                  <Button size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                    Marcar como tomado
                  </Button>
                )}
                {medication.status === 'atrasado' && (
                  <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2 sm:px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto">
                    Tomar agora
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add Medication Button */}
        <Button 
          variant="outline" 
          className="w-full mt-3 sm:mt-4 border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 h-10 sm:h-11 text-sm"
        >
          <Pill className="h-4 w-4 mr-2" />
          Adicionar Medicamento
        </Button>
      </CardContent>
    </Card>
  );
};

export default MedicationReminders;
