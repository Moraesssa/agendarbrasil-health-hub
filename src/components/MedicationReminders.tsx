import { Pill, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMedicationManagement } from "@/hooks/useMedicationManagement";
import { AddMedicationDialog } from "@/components/medication/AddMedicationDialog";
import { EditMedicationDialog } from "@/components/medication/EditMedicationDialog";
import { Skeleton } from "@/components/ui/skeleton";

const MedicationReminders = () => {
  const { 
    medications,
    pendingDoses, 
    loading, 
    isSubmitting, 
    createMedication, 
    editMedication,
    markDoseAsTaken,
    deleteMedication
  } = useMedicationManagement();

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

  const handleMarkAsTaken = async (doseId: string) => {
    await markDoseAsTaken(doseId);
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
              <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
              Medicamentos
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 sm:p-4 rounded-xl border">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
            <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
            Medicamentos
          </div>
          {Array.isArray(medications) && medications.length > 0 && (
            <EditMedicationDialog
              medication={medications[0]}
              onEdit={editMedication}
              onDelete={deleteMedication}
              isLoading={isSubmitting}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {!Array.isArray(pendingDoses) || pendingDoses.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum medicamento cadastrado</p>
            <AddMedicationDialog onAdd={createMedication} isLoading={isSubmitting} />
          </div>
        ) : (
          <>
            {Array.isArray(pendingDoses) && pendingDoses.map((medication) => {
              const medicationData = Array.isArray(medications) ? medications.find(m => m.id === medication.reminderId) : null;
              return (
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
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {medication.name}
                          </h3>
                          {medicationData && (
                            <EditMedicationDialog
                              medication={medicationData}
                              onEdit={editMedication}
                              onDelete={deleteMedication}
                              isLoading={isSubmitting}
                            />
                          )}
                        </div>
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
                        <Button 
                          size="sm" 
                          className="h-7 sm:h-8 px-2 sm:px-3 text-xs bg-green-500 hover:bg-green-600 w-full sm:w-auto"
                          onClick={() => handleMarkAsTaken(medication.id)}
                          disabled={isSubmitting}
                        >
                          Marcar como tomado
                        </Button>
                      )}
                      {medication.status === 'atrasado' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 sm:h-8 px-2 sm:px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                          onClick={() => handleMarkAsTaken(medication.id)}
                          disabled={isSubmitting}
                        >
                          Tomar agora
                        </Button>
                      )}
                      {medication.status === 'tomado' && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Tomado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Medication Button */}
            <AddMedicationDialog onAdd={createMedication} isLoading={isSubmitting} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationReminders;
