
import { Pill, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMedicationRemindersV2 } from "@/hooks/useMedicationRemindersV2";
import { AddMedicationDialog } from "./medication/AddMedicationDialog";
import { MedicationCard } from "./medication/MedicationCard";
import { MedicationProgress } from "./medication/MedicationProgress";

const MedicationRemindersV2 = () => {
  const { medications, isLoading, loadMedications, isSubmitting, markAsTaken, markAsSkipped } = useMedicationRemindersV2();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleMedicationAdded = () => {
    loadMedications();
    setShowAddDialog(false);
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
            <>
              <MedicationProgress medications={medications} />
              
              {medications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onMarkAsTaken={markAsTaken}
                  onMarkAsSkipped={markAsSkipped}
                  isSubmitting={isSubmitting}
                />
              ))}
            </>
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

export default MedicationRemindersV2;
