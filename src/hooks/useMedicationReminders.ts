
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { medicationService, MedicationWithDoses, MedicationReminder } from "@/services/medicationService";
import { logger } from "@/utils/logger";

export const useMedicationReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [medications, setMedications] = useState<MedicationWithDoses[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMedications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await medicationService.getMedicationReminders();
      setMedications(data);
    } catch (error) {
      logger.error("Erro ao carregar medicamentos", "useMedicationReminders", error);
      toast({
        title: "Erro ao carregar medicamentos",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createMedication = async (medication: Omit<MedicationReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    try {
      await medicationService.createMedicationReminder(medication);
      toast({
        title: "Medicamento adicionado!",
        description: `${medication.medication_name} foi adicionado aos seus lembretes.`
      });
      await loadMedications();
    } catch (error) {
      logger.error("Erro ao criar medicamento", "useMedicationReminders", error);
      toast({
        title: "Erro ao adicionar medicamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMedication = async (id: string, updates: Partial<MedicationReminder>) => {
    setIsSubmitting(true);
    try {
      await medicationService.updateMedicationReminder(id, updates);
      toast({
        title: "Medicamento atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
      await loadMedications();
    } catch (error) {
      logger.error("Erro ao atualizar medicamento", "useMedicationReminders", error);
      toast({
        title: "Erro ao atualizar medicamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMedication = async (id: string) => {
    setIsSubmitting(true);
    try {
      await medicationService.deleteMedicationReminder(id);
      toast({
        title: "Medicamento removido",
        description: "O lembrete foi removido com sucesso."
      });
      await loadMedications();
    } catch (error) {
      logger.error("Erro ao deletar medicamento", "useMedicationReminders", error);
      toast({
        title: "Erro ao remover medicamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsTaken = async (medicationId: string, doseId?: string, notes?: string) => {
    try {
      if (doseId) {
        await medicationService.markDoseAsTaken(doseId, notes);
      } else {
        // Find today's pending dose for this medication
        const medication = medications.find(m => m.id === medicationId);
        const pendingDose = medication?.today_doses?.find(d => d.status === 'pending');
        
        if (pendingDose) {
          await medicationService.markDoseAsTaken(pendingDose.id, notes);
        }
      }
      
      toast({
        title: "Dose marcada como tomada!",
        description: "Parabéns por manter sua medicação em dia."
      });
      await loadMedications();
    } catch (error) {
      logger.error("Erro ao marcar dose como tomada", "useMedicationReminders", error);
      toast({
        title: "Erro ao marcar dose",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const markAsSkipped = async (medicationId: string, doseId?: string, notes?: string) => {
    try {
      if (doseId) {
        await medicationService.markDoseAsSkipped(doseId, notes);
      } else {
        // Find today's pending dose for this medication
        const medication = medications.find(m => m.id === medicationId);
        const pendingDose = medication?.today_doses?.find(d => d.status === 'pending');
        
        if (pendingDose) {
          await medicationService.markDoseAsSkipped(pendingDose.id, notes);
        }
      }
      
      toast({
        title: "Dose marcada como pulada",
        description: "Lembre-se de não pular doses sem orientação médica."
      });
      await loadMedications();
    } catch (error) {
      logger.error("Erro ao marcar dose como pulada", "useMedicationReminders", error);
      toast({
        title: "Erro ao marcar dose",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadMedications();
  }, [user]);

  return {
    medications,
    isLoading,
    isSubmitting,
    loadMedications,
    createMedication,
    updateMedication,
    deleteMedication,
    markAsTaken,
    markAsSkipped
  };
};
