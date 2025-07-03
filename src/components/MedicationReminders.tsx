
import { Pill, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMedicationReminders } from "@/hooks/useMedicationReminders";
import { useMedicationActions } from "@/hooks/useMedicationActions";
import { AddMedicationDialog } from "./medication/AddMedicationDialog";
import { translateFrequency } from "@/utils/translations";

const MedicationReminders = () => {
  const { medications, isLoading, loadMedications, isSubmitting } = useMedicationReminders();
  const { markAsTaken, markAsSkipped } = useMedicationActions({
    medications,
    setMedications: () => {},
    loadMedications,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Garantir que o componente responda a mudanças de medicamentos
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMedicationAdded = () => {
    loadMedications();
    setRefreshKey(prevKey => prevKey + 1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'taken': return 'Tomado';
      case 'overdue': return 'Atrasado';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
            <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
            Medicamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-8 text-gray-500">
            Carregando medicamentos...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
          {medications.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum medicamento cadastrado.</p>
              <Button
                type="button"
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro medicamento
              </Button>
            </div>
          ) : (
            medications.map((medication) => (
              <div
                key={medication.id}
                className={`p-3 sm:p-4 rounded-xl border transition-all ${
                  medication.status === 'overdue' 
                    ? 'bg-red-50 border-red-200' 
                    : medication.status === 'taken'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="mt-1 flex-shrink-0">
                      {getStatusIcon(medication.status || 'pending')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {medication.medication_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {medication.dosage} • {translateFrequency(medication.frequency)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(medication.status || 'pending')} border-0 text-xs flex-shrink-0 ml-2`}>
                    {getStatusText(medication.status || 'pending')}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{medication.times.join(', ')}</span>
                    </div>
                    {medication.next_dose_time && (
                      <span className="text-xs sm:text-sm">
                        Próxima: {medication.next_dose_time}
                      </span>
                    )}
                  </div>
                  <div className="w-full sm:w-auto flex gap-2">
                    {medication.status === 'pending' && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 sm:h-8 px-2 sm:px-3 text-xs bg-green-500 hover:bg-green-600 flex-1 sm:flex-none"
                        onClick={() => markAsTaken(medication.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Processando...' : 'Marcar como tomado'}
                      </Button>
                    )}
                    {(medication.status === 'overdue' || medication.status === 'pending') && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 sm:h-8 px-2 sm:px-3 text-xs border-gray-200 text-gray-600 hover:bg-gray-50 flex-1 sm:flex-none"
                        onClick={() => markAsSkipped(medication.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Processando...' : 'Pular dose'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add Medication Button */}
          {medications.length > 0 && (
            <Button 
              type="button"
              variant="outline" 
              className="w-full mt-3 sm:mt-4 border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 h-10 sm:h-11 text-sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>
          )}
        </CardContent>
      </Card>

      <AddMedicationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onMedicationAdded={handleMedicationAdded}
      />
    </>
  );
};

export default MedicationReminders;
