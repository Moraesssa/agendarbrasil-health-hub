
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { medicationService, MedicationWithDoses } from "@/services/medicationService";
import { logger } from "@/utils/logger";
import { findClosestPendingDose } from "@/utils/medicationDoseUtils";

interface UseMedicationActionsProps {
  medications: MedicationWithDoses[];
  setMedications: React.Dispatch<React.SetStateAction<MedicationWithDoses[]>>;
  loadMedications: () => Promise<void>;
}

export const useMedicationActions = ({ 
  medications, 
  setMedications, 
  loadMedications 
}: UseMedicationActionsProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markAsTaken = async (medicationId: string, doseId?: string, notes?: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      toast({ title: "Erro", description: "Medicamento não encontrado.", variant: "destructive" });
      return;
    }
    
    logger.debug("Marcando medicamento como tomado", "markAsTaken", { 
      medicationId, 
      medication: {
        id: medication.id,
        name: medication.medication_name,
        dosesCount: medication.today_doses?.length || 0,
        doses: medication.today_doses?.map(d => ({ 
          id: d.id, 
          status: d.status, 
          time: d.scheduled_time 
        })) || []
      }
    });
    
    const pendingDose = findClosestPendingDose(medication?.today_doses);
    const targetDoseId = doseId || pendingDose?.id;

    if (!targetDoseId) {
      logger.error("Nenhuma dose pendente encontrada", "markAsTaken", {
        medicationId,
        providedDoseId: doseId,
        foundPendingDose: pendingDose,
        allDoses: medication.today_doses
      });
      
      toast({ 
        title: "Nenhuma dose pendente", 
        description: "Não há doses pendentes para marcar como tomadas. Tente recarregar a página.",
        variant: "destructive" 
      });
      
      loadMedications();
      return;
    }

    // Atualização otimista imediata - ANTES da chamada de API
    setMedications(prevMeds => {
      const newMeds = prevMeds.map(med => {
        if (med.id === medicationId) {
          const updatedDoses = med.today_doses?.map(dose =>
            dose.id === targetDoseId ? { ...dose, status: 'taken' as const } : dose
          ) || [];

          const allTaken = updatedDoses.every(d => d.status === 'taken');
          const hasPending = updatedDoses.some(d => d.status === 'pending');
          const newStatus: 'pending' | 'taken' | 'missed' | 'overdue' = allTaken ? 'taken' : hasPending ? 'pending' : 'overdue';

          logger.debug("Estado atualizado otimisticamente", "markAsTaken", {
            medicationId,
            targetDoseId,
            newStatus,
            updatedDoses: updatedDoses.map(d => ({ id: d.id, status: d.status }))
          });

          return {
            ...med,
            today_doses: updatedDoses,
            status: newStatus
          };
        }
        return med;
      });
      return newMeds;
    });

    // Feedback imediato ao usuário
    toast({
      title: "Dose marcada como tomada!",
      description: "Parabéns por manter sua medicação em dia."
    });

    // Agora fazemos a chamada de API em background
    try {
      await medicationService.markDoseAsTaken(targetDoseId, notes);
      
      // Recarrega os dados para garantir sincronização com o backend
      const refreshedData = await medicationService.getMedicationReminders();
      setMedications(refreshedData);
      
      logger.debug("Dados recarregados após atualização", "markAsTaken", {
        count: refreshedData.length
      });
    } catch (error) {
      logger.error("Erro ao marcar dose como tomada", "markAsTaken", error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um erro ao salvar as alterações. Atualizando dados...",
        variant: "destructive"
      });
      
      // Se falhar, recarrega os dados para reverter o estado otimista
      loadMedications();
    }
  };

  const markAsSkipped = async (medicationId: string, doseId?: string, notes?: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      toast({ title: "Erro", description: "Medicamento não encontrado.", variant: "destructive" });
      return;
    }
    
    logger.debug("Marcando medicamento como pulado", "markAsSkipped", { 
      medicationId, 
      medication: {
        id: medication.id,
        name: medication.medication_name,
        dosesCount: medication.today_doses?.length || 0
      }
    });
    
    const pendingDose = findClosestPendingDose(medication?.today_doses);
    const targetDoseId = doseId || pendingDose?.id;

    if (!targetDoseId) {
      logger.error("Nenhuma dose pendente encontrada", "markAsSkipped", {
        medicationId,
        providedDoseId: doseId,
        foundPendingDose: pendingDose,
        allDoses: medication.today_doses
      });
      
      toast({ 
        title: "Nenhuma dose pendente", 
        description: "Não há doses pendentes para pular. Tente recarregar a página.",
        variant: "destructive" 
      });
      
      loadMedications();
      return;
    }

    // Atualização otimista imediata - ANTES da chamada de API
    setMedications(prevMeds => {
      const newMeds = prevMeds.map(med => {
        if (med.id === medicationId) {
          const updatedDoses = med.today_doses?.map(dose =>
            dose.id === targetDoseId ? { ...dose, status: 'skipped' as const } : dose
          ) || [];
            
          const allTakenOrSkipped = updatedDoses.every(d => d.status === 'taken' || d.status === 'skipped');
          const hasPending = updatedDoses.some(d => d.status === 'pending');
          const newStatus: 'pending' | 'taken' | 'missed' | 'overdue' = hasPending ? 'pending' : allTakenOrSkipped ? 'taken' : 'overdue';

          logger.debug("Estado atualizado otimisticamente", "markAsSkipped", {
            medicationId,
            targetDoseId,
            newStatus,
            updatedDoses: updatedDoses.map(d => ({ id: d.id, status: d.status }))
          });

          return {
            ...med,
            today_doses: updatedDoses,
            status: newStatus
          };
        }
        return med;
      });
      return newMeds;
    });

    // Feedback imediato ao usuário
    toast({
      title: "Dose marcada como pulada",
      description: "Lembre-se de não pular doses sem orientação médica."
    });

    // Agora fazemos a chamada de API em background
    try {
      await medicationService.markDoseAsSkipped(targetDoseId, notes);
      
      // Recarrega os dados para garantir sincronização com o backend
      const refreshedData = await medicationService.getMedicationReminders();
      setMedications(refreshedData);
      
      logger.debug("Dados recarregados após atualização", "markAsSkipped", {
        count: refreshedData.length
      });
    } catch (error) {
      logger.error("Erro ao marcar dose como pulada", "markAsSkipped", error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um erro ao salvar as alterações. Atualizando dados...",
        variant: "destructive"
      });
      
      // Se falhar, recarrega os dados para reverter o estado otimista
      loadMedications();
    }
  };

  return {
    markAsTaken,
    markAsSkipped,
    isSubmitting,
    setIsSubmitting
  };
};
