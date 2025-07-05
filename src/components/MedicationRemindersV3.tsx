
import React, { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useMedicationRemindersV3 } from "@/hooks/useMedicationRemindersV3";
import { calculateMedicationStatus, calculateMedicationProgress } from "@/utils/medicationStatusUtils";
import { LoadingFallback } from "@/components/LoadingFallback";
import { ErrorFallback } from "@/components/ErrorFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const MedicationCard = ({ medication, onMarkAsTaken, onMarkAsSkipped, isSubmitting }: any) => {
  const status = calculateMedicationStatus(medication);
  const progress = calculateMedicationProgress(medication);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'taken': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'taken': return CheckCircle;
      case 'overdue': return AlertCircle;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{medication.medication_name}</CardTitle>
          </div>
          <Badge className={getStatusColor(status)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status === 'completed' && 'Completo'}
            {status === 'taken' && 'Tomado'}
            {status === 'partial' && 'Parcial'}
            {status === 'overdue' && 'Atrasado'}
            {status === 'pending' && 'Pendente'}
          </Badge>
        </div>
        <div className="text-sm text-gray-600">
          <p>Dosagem: {medication.dosage}</p>
          <p>Frequência: {medication.frequency}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso de hoje:</span>
            <span className="font-medium">{progress.taken}/{progress.total} doses</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {status !== 'completed' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onMarkAsTaken(medication.id)}
                disabled={isSubmitting}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Tomei
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkAsSkipped(medication.id)}
                disabled={isSubmitting}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Pular
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MedicationRemindersContent = () => {
  const {
    medications,
    isLoading,
    isSubmitting,
    error,
    markAsTaken,
    markAsSkipped,
    retry
  } = useMedicationRemindersV3();

  if (error) {
    return (
      <ErrorFallback
        title="Erro ao carregar medicamentos"
        description={error}
        onRetry={retry}
      />
    );
  }

  if (isLoading) {
    return <LoadingFallback message="Carregando seus medicamentos..." />;
  }

  if (medications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum medicamento cadastrado</p>
          <p className="text-sm text-gray-500 mt-2">
            Adicione seus medicamentos para receber lembretes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {medications.map((medication) => (
        <MedicationCard
          key={medication.id}
          medication={medication}
          onMarkAsTaken={markAsTaken}
          onMarkAsSkipped={markAsSkipped}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
};

const MedicationRemindersV3 = () => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Pill className="h-5 w-5" />
          Lembretes de Medicamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ErrorBoundary 
          context="MedicationReminders"
          fallback={
            <ErrorFallback
              title="Erro nos medicamentos"
              description="Não foi possível carregar os lembretes de medicamentos."
            />
          }
        >
          <Suspense fallback={<LoadingFallback message="Carregando medicamentos..." />}>
            <MedicationRemindersContent />
          </Suspense>
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
};

export default MedicationRemindersV3;
