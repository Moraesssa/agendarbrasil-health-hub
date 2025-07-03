
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pill, Plus, Search, Edit, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useMedicationRemindersV2 } from "@/hooks/useMedicationRemindersV2";
import { AddMedicationDialog } from "@/components/medication/AddMedicationDialog";
import Header from "@/components/Header";
import { translateFrequency } from "@/utils/translations";
import { calculateMedicationStatus, calculateMedicationProgress, getNextDoseTime } from "@/utils/medicationStatusUtils";

const Medicamentos = () => {
  const navigate = useNavigate();
  const { medications, isLoading, deleteMedication, markAsTaken, markAsSkipped, loadMedications } = useMedicationRemindersV2();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMedications = medications.filter(med => 
    med.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.dosage.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      case 'completed': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'partial': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${name}" dos seus lembretes?`)) {
      await deleteMedication(id);
    }
  };

  const handleMedicationAdded = () => {
    loadMedications();
    setShowAddDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Meus Medicamentos</h1>
            <p className="text-gray-600">Gerencie seus lembretes de medicamentos.</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Medicamento
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando medicamentos...</p>
          </div>
        ) : filteredMedications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm ? 'Nenhum medicamento encontrado' : 'Nenhum medicamento cadastrado'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Tente alterar o termo da busca.'
                  : 'Adicione seu primeiro medicamento para começar a monitorar sua saúde.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro medicamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMedications.map((medication) => {
              const status = calculateMedicationStatus(medication);
              const progress = calculateMedicationProgress(medication);
              const nextDoseTime = getNextDoseTime(medication);
              
              return (
                <Card key={medication.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <CardTitle className="text-lg">{medication.medication_name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {medication.dosage} • {translateFrequency(medication.frequency)}
                          </p>
                          {progress.total > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {progress.taken}/{progress.total} doses hoje ({progress.percentage}%)
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(status)} border-0`}>
                          {getStatusText(status)}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(medication.id, medication.medication_name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Horários:</p>
                        <div className="flex flex-wrap gap-2">
                          {medication.times.map((time) => (
                            <Badge key={time} variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          ))}
                        </div>
                        {nextDoseTime && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            Próxima dose: {nextDoseTime}
                          </p>
                        )}
                      </div>

                      {medication.instructions && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Instruções:</p>
                          <p className="text-sm text-gray-600">{medication.instructions}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm text-gray-500">
                          Início: {new Date(medication.start_date).toLocaleDateString('pt-BR')}
                          {medication.end_date && (
                            <> • Fim: {new Date(medication.end_date).toLocaleDateString('pt-BR')}</>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {(status === 'pending' || status === 'partial' || status === 'overdue') && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => markAsTaken(medication.id)}
                              >
                                Marcar como tomado
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAsSkipped(medication.id)}
                              >
                                Pular dose
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AddMedicationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onMedicationAdded={handleMedicationAdded}
      />
    </div>
  );
};

export default Medicamentos;
