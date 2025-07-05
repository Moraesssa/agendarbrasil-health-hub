
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { medicationServiceV2 } from "@/services/medicationServiceV2";
import { logger } from "@/utils/logger";
import { MedicationWithDoses } from "@/types/medication";
import { findDoseToAct } from "@/utils/medicationStatusUtils";

export const useMedicationRemindersV3 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [medications, setMedications] = useState<MedicationWithDoses[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMedications = useCallback(async () => {
    if (!user) {
      setMedications([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug("Carregando medicamentos", "useMedicationRemindersV3", { userId: user.id });
      const data = await medicationServiceV2.getMedicationReminders();
      setMedications(data);
      logger.debug("Medicamentos carregados", "useMedicationRemindersV3", { count: data.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error("Erro ao carregar medicamentos", "useMedicationRemindersV3", { error: errorMessage });
      setError(errorMessage);
      
      // Não mostrar toast em caso de erro silencioso
      if (!errorMessage.includes('fetch')) {
        toast({
          title: "Erro ao carregar medicamentos",
          description: "Tente novamente em alguns instantes",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const markAsTaken = useCallback(async (medicationId: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      toast({ title: "Erro", description: "Medicamento não encontrado.", variant: "destructive" });
      return;
    }
    
    const doseToAct = findDoseToAct(medication);
    if (!doseToAct) {
      toast({ 
        title: "Nenhuma dose pendente", 
        description: "Não há doses pendentes para marcar como tomadas.",
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Atualização otimista
      setMedications(prevMeds => 
        prevMeds.map(med => {
          if (med.id === medicationId) {
            const updatedDoses = med.today_doses?.map(dose =>
              dose.id === doseToAct.id ? { ...dose, status: 'taken' as const } : dose
            ) || [];
            return { ...med, today_doses: updatedDoses };
          }
          return med;
        })
      );

      await medicationServiceV2.markDoseAsTaken(doseToAct.id);
      
      toast({
        title: "Dose marcada como tomada!",
        description: "Parabéns por manter sua medicação em dia."
      });

      // Recarregar para sincronizar
      setTimeout(() => loadMedications(), 500);
      
    } catch (error) {
      logger.error("Erro ao marcar dose como tomada", "useMedicationRemindersV3", error);
      toast({
        title: "Erro ao salvar",
        description: "Revertendo alteração...",
        variant: "destructive"
      });
      // Reverter estado otimista
      loadMedications();
    } finally {
      setIsSubmitting(false);
    }
  }, [medications, toast, loadMedications]);

  const markAsSkipped = useCallback(async (medicationId: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      toast({ title: "Erro", description: "Medicamento não encontrado.", variant: "destructive" });
      return;
    }
    
    const doseToAct = findDoseToAct(medication);
    if (!doseToAct) {
      toast({ 
        title: "Nenhuma dose pendente", 
        description: "Não há doses pendentes para pular.",
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Atualização otimista
      setMedications(prevMeds => 
        prevMeds.map(med => {
          if (med.id === medicationId) {
            const updatedDoses = med.today_doses?.map(dose =>
              dose.id === doseToAct.id ? { ...dose, status: 'skipped' as const } : dose
            ) || [];
            return { ...med, today_doses: updatedDoses };
          }
          return med;
        })
      );

      await medicationServiceV2.markDoseAsSkipped(doseToAct.id);
      
      toast({
        title: "Dose marcada como pulada",
        description: "Lembre-se de não pular doses sem orientação médica."
      });

      // Recarregar para sincronizar
      setTimeout(() => loadMedications(), 500);
      
    } catch (error) {
      logger.error("Erro ao marcar dose como pulada", "useMedicationRemindersV3", error);
      toast({
        title: "Erro ao salvar",
        description: "Revertendo alteração...",
        variant: "destructive"
      });
      // Reverter estado otimista
      loadMedications();
    } finally {
      setIsSubmitting(false);
    }
  }, [medications, toast, loadMedications]);

  const createMedication = useCallback(async (medication: Parameters<typeof medicationServiceV2.createMedicationReminder>[0]) => {
    setIsSubmitting(true);
    try {
      const newMedication = await medicationServiceV2.createMedicationReminder(medication);
      
      toast({
        title: "Medicamento adicionado!",
        description: `${medication.medication_name} foi adicionado aos seus lembretes.`
      });
      
      loadMedications();
      return newMedication;
    } catch (error) {
      logger.error("Erro ao criar medicamento", "useMedicationRemindersV3", error);
      toast({
        title: "Erro ao adicionar medicamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [toast, loadMedications]);

  const updateMedication = useCallback(async (id: string, updates: Parameters<typeof medicationServiceV2.updateMedicationReminder>[1]) => {
    setIsSubmitting(true);
    try {
      await medicationServiceV2.updateMedicationReminder(id, updates);
      toast({
        title: "Medicamento atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
      loadMedications();
    } catch (error) {
      logger.error("Erro ao atualizar medicamento", "useMedicationRemindersV3", error);
      toast({
        title: "Erro ao atualizar medicamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [toast, loadMedications]);

  const deleteMedication = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await medicationServiceV2.deleteMedicationReminder(id);
      toast({
        title: "Medicamento removido",
        description: "O lembrete foi removido com sucesso."
      });
      loadMedications();
    } catch (error) {
      logger.error("Erro ao deletar medicamento", "useMedicationRemindersV3", error);
      toast({
        title: "Erro ao remover medicamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [toast, loadMedications]);

  const retry = useCallback(() => {
    loadMedications();
  }, [loadMedications]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  return {
    medications,
    isLoading,
    isSubmitting,
    error,
    loadMedications,
    createMedication,
    updateMedication,
    deleteMedication,
    markAsTaken,
    markAsSkipped,
    retry
  };
};
