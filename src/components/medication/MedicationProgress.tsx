
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pill, Clock, CheckCircle, XCircle } from "lucide-react";
import { MedicationWithDoses } from "@/types/medication";
import { calculateMedicationProgress } from "@/utils/medicationStatusUtils";

interface MedicationProgressProps {
  medications: MedicationWithDoses[];
}

export const MedicationProgress = ({ medications }: MedicationProgressProps) => {
  const totalMedications = medications.length;
  const completedMedications = medications.filter(med => {
    const progress = calculateMedicationProgress(med);
    return progress.percentage === 100;
  }).length;
  
  const totalDoses = medications.reduce((acc, med) => {
    const progress = calculateMedicationProgress(med);
    return acc + progress.total;
  }, 0);
  
  const takenDoses = medications.reduce((acc, med) => {
    const progress = calculateMedicationProgress(med);
    return acc + progress.taken;
  }, 0);
  
  const overallProgress = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  if (totalMedications === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pill className="h-5 w-5 text-blue-600" />
          Progresso do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Pill className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">{totalMedications}</span>
            </div>
            <p className="text-xs text-gray-600">Medicamentos</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">{completedMedications}</span>
            </div>
            <p className="text-xs text-gray-600">Completos</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-lg font-bold text-orange-600">{takenDoses}</span>
            </div>
            <p className="text-xs text-gray-600">Doses Tomadas</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-gray-600" />
              <span className="text-lg font-bold text-gray-600">{totalDoses}</span>
            </div>
            <p className="text-xs text-gray-600">Total Doses</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
            <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
