
import { useState } from "react";
import { Pill, Clock, FileText, RotateCcw, AlertCircle, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrescriptionManagement } from "@/hooks/usePrescriptionManagement";
import { useMedicationManagement } from "@/hooks/useMedicationManagement";
import PrescriptionCard from "@/components/medication/PrescriptionCard";
import RenewalRequestDialog from "@/components/medication/RenewalRequestDialog";
import PrescriptionHistoryDialog from "@/components/medication/PrescriptionHistoryDialog";
import MedicationReminders from "@/components/MedicationReminders";
import { AddMedicationDialog } from "@/components/medication/AddMedicationDialog";
import { CreateRenewalRequest } from "@/types/prescription";
import { useNavigate } from "react-router-dom";

const GestaoMedicamentos = () => {
  const navigate = useNavigate();
  const {
    prescriptions,
    activePrescriptions,
    renewals,
    loading: prescriptionLoading,
    isSubmitting,
    requestRenewal,
    getPrescriptionHistory,
    getExpiringSoon,
    getPendingRenewals
  } = usePrescriptionManagement();

  const {
    createMedication,
    isSubmitting: medicationSubmitting
  } = useMedicationManagement();

  const [selectedPrescriptionForRenewal, setSelectedPrescriptionForRenewal] = useState<string | null>(null);

  const expiringSoon = getExpiringSoon();
  const pendingRenewals = getPendingRenewals();

  const handleRequestRenewal = async (data: CreateRenewalRequest) => {
    const success = await requestRenewal(data);
    if (success) {
      setSelectedPrescriptionForRenewal(null);
    }
    return success;
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (prescriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-blue-900">
            Gestão de Medicamentos
          </h1>
        </div>
        <p className="text-gray-600">
          Gerencie suas prescrições, lembretes e solicitações de renovação
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Pill className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{activePrescriptions.length}</p>
              <p className="text-sm text-blue-700">Prescrições Ativas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-900">{expiringSoon.length}</p>
              <p className="text-sm text-yellow-700">Expirando em Breve</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <RotateCcw className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">{pendingRenewals.length}</p>
              <p className="text-sm text-green-700">Renovações Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">{prescriptions.length}</p>
              <p className="text-sm text-purple-700">Total de Prescrições</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="prescriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prescriptions">Prescrições</TabsTrigger>
          <TabsTrigger value="reminders">Lembretes</TabsTrigger>
          <TabsTrigger value="renewals">Renovações</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-blue-900">Minhas Prescrições</h2>
          </div>

          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma prescrição encontrada
                </h3>
                <p className="text-gray-600">
                  Suas prescrições médicas aparecerão aqui quando forem cadastradas pelo seu médico.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id}>
                  <PrescriptionCard
                    prescription={prescription}
                    onRequestRenewal={setSelectedPrescriptionForRenewal}
                    onViewHistory={getPrescriptionHistory}
                    isSubmitting={isSubmitting}
                  />
                  
                  {selectedPrescriptionForRenewal === prescription.id && (
                    <RenewalRequestDialog
                      prescriptionId={prescription.id}
                      medicationName={prescription.medication_name}
                      onRequestRenewal={handleRequestRenewal}
                      isLoading={isSubmitting}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-blue-900">Lembretes de Medicamentos</h2>
            <AddMedicationDialog onAdd={createMedication} isLoading={medicationSubmitting} />
          </div>
          
          <MedicationReminders />
        </TabsContent>

        <TabsContent value="renewals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-blue-900">Solicitações de Renovação</h2>
          </div>

          {renewals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <RotateCcw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma solicitação de renovação
                </h3>
                <p className="text-gray-600">
                  Suas solicitações de renovação aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {renewals.map((renewal) => (
                <Card key={renewal.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {renewal.prescription?.medication_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Dr. {renewal.doctor_name}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          renewal.status === 'approved' ? 'default' : 
                          renewal.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {renewal.status === 'pending' && 'Pendente'}
                        {renewal.status === 'approved' && 'Aprovada'}
                        {renewal.status === 'denied' && 'Negada'}
                        {renewal.status === 'expired' && 'Expirada'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Solicitada em:</span>
                        <p className="font-medium">
                          {new Date(renewal.request_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      {renewal.requested_duration_days && (
                        <div>
                          <span className="text-gray-600">Duração solicitada:</span>
                          <p className="font-medium">{renewal.requested_duration_days} dias</p>
                        </div>
                      )}
                    </div>
                    
                    {renewal.patient_notes && (
                      <div className="bg-blue-50 p-3 rounded text-sm mb-3">
                        <span className="font-medium text-blue-900">Suas observações:</span>
                        <p className="text-blue-800 mt-1">{renewal.patient_notes}</p>
                      </div>
                    )}
                    
                    {renewal.doctor_notes && (
                      <div className="bg-green-50 p-3 rounded text-sm">
                        <span className="font-medium text-green-900">Resposta do médico:</span>
                        <p className="text-green-800 mt-1">{renewal.doctor_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GestaoMedicamentos;
