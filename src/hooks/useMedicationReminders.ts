
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

  const findClosestPendingDose = (doses: MedicationWithDoses['today_doses']) => {
    if (!doses || doses.length === 0) return null;

    const now = new Date();
    const pendingDoses = doses.filter(d => d.status === 'pending');

    if (pendingDoses.length === 0) return null;
    if (pendingDoses.length === 1) return pendingDoses[0];

    return pendingDoses.reduce((closest, current) => {
      const closestTime = new Date();
      const [closestHours, closestMinutes] = closest.scheduled_time.split(':').map(Number);
      closestTime.setHours(closestHours, closestMinutes, 0, 0);

      const currentTime = new Date();
      const [currentHours, currentMinutes] = current.scheduled_time.split(':').map(Number);
      currentTime.setHours(currentHours, currentMinutes, 0, 0);

      const closestDiff = Math.abs(closestTime.getTime() - now.getTime());
      const currentDiff = Math.abs(currentTime.getTime() - now.getTime());

      return currentDiff < closestDiff ? current : closest;
    });
  };

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
    const medication = medications.find(m => m.id === medicationId);
    const pendingDose = findClosestPendingDose(medication?.today_doses);
    const targetDoseId = doseId || pendingDose?.id;

    if (!targetDoseId) {
      toast({ title: "Erro", description: "Nenhuma dose pendente encontrada para pular.", variant: "destructive" });
      return;
    }

    try {
      await medicationService.markDoseAsTaken(targetDoseId, notes);

      setMedications(prevMeds => {
        const newMeds = prevMeds.map(med => {
          if (med.id === medicationId) {
            const updatedDoses = med.today_doses.map(dose =>
              dose.id === targetDoseId ? { ...dose, status: 'taken' as const } : dose
            );

            const allTaken = updatedDoses.every(d => d.status === 'taken');
            const hasPending = updatedDoses.some(d => d.status === 'pending');
            const newStatus: 'pending' | 'taken' | 'missed' | 'overdue' = allTaken ? 'taken' : hasPending ? 'pending' : 'overdue';

            return { ...med, today_doses: updatedDoses, status: newStatus };
          }
          return med;
        });
        return newMeds;
      });

      toast({
        title: "Dose marcada como tomada!",
        description: "Parabéns por manter sua medicação em dia."
      });
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
    const medication = medications.find(m => m.id === medicationId);
    const pendingDose = findClosestPendingDose(medication?.today_doses);
    const targetDoseId = doseId || pendingDose?.id;

    if (!targetDoseId) {
      toast({ title: "Erro", description: "Nenhuma dose pendente encontrada para pular.", variant: "destructive" });
      return;
    }

    try {
      await medicationService.markDoseAsSkipped(targetDoseId, notes);

      setMedications(prevMeds => {
        const newMeds = prevMeds.map(med => {
          if (med.id === medicationId) {
            const updatedDoses = med.today_doses.map(dose =>
              dose.id === targetDoseId ? { ...dose, status: 'skipped' as const } : dose
            );
            
            const allTakenOrSkipped = updatedDoses.every(d => d.status === 'taken' || d.status === 'skipped');
            const hasPending = updatedDoses.some(d => d.status === 'pending');
            const newStatus: 'pending' | 'taken' | 'missed' | 'overdue' = hasPending ? 'pending' : allTakenOrSkipped ? 'taken' : 'overdue';

            return { ...med, today_doses: updatedDoses, status: newStatus };
          }
          return med;
        });
        return newMeds;
      });

      toast({
        title: "Dose marcada como pulada",
        description: "Lembre-se de não pular doses sem orientação médica."
      });
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
