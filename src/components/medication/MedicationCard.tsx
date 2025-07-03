
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, Pill } from "lucide-react";
import { MedicationWithDoses } from "@/types/medication";
import { calculateMedicationStatus, calculateMedicationProgress, getNextDoseTime } from "@/utils/medicationStatusUtils";
import { translateFrequency } from "@/utils/translations";

interface MedicationCardProps {
  medication: MedicationWithDoses;
  onMarkAsTaken: (medicationId: string) => void;
  onMarkAsSkipped: (medicationId: string) => void;
  isSubmitting: boolean;
}

export const MedicationCard = ({ 
  medication, 
  onMarkAsTaken, 
  onMarkAsSkipped, 
  isSubmitting 
}: MedicationCardProps) => {
  const status = calculateMedicationStatus(medication);
  const progress = calculateMedicationProgress(medication);
  const nextDoseTime = getNextDoseTime(medication);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'partial': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'partial': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completo';
      case 'overdue': return 'Atrasado';
      case 'partial': return 'Parcial';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getBackgroundColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'overdue': return 'bg-red-50 border-red-200';
      case 'partial': return 'bg-blue-50 border-blue-200';
      default: return 'bg-yellow-50 border-yellow-200';
    }
  };

  const showActionButtons = status === 'pending' || status === 'overdue' || status === 'partial';

  return (
    <div className={`p-3 sm:p-4 rounded-xl border transition-all ${getBackgroundColor(status)}`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="mt-1 flex-shrink-0">
            {getStatusIcon(status)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {medication.medication_name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {medication.dosage} • {translateFrequency(medication.frequency)}
            </p>
            {progress.total > 0 && (
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Pill className="h-3 w-3" />
                  <span>{progress.taken}/{progress.total} doses</span>
                </div>
                <span>•</span>
                <span>{progress.percentage}% concluído</span>
              </div>
            )}
          </div>
        </div>
        <Badge className={`${getStatusColor(status)} border text-xs flex-shrink-0 ml-2`}>
          {getStatusText(status)}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{medication.times.join(', ')}</span>
          </div>
          {nextDoseTime && (
            <span className="text-xs sm:text-sm font-medium text-blue-600">
              Próxima: {nextDoseTime}
            </span>
          )}
        </div>
        
        {showActionButtons && (
          <div className="w-full sm:w-auto flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs bg-green-500 hover:bg-green-600 flex-1 sm:flex-none"
              onClick={() => onMarkAsTaken(medication.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processando...' : 'Marcar como tomado'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs border-gray-200 text-gray-600 hover:bg-gray-50 flex-1 sm:flex-none"
              onClick={() => onMarkAsSkipped(medication.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processando...' : 'Pular dose'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
