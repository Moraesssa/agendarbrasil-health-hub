
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContextV2";
import { useToast } from "@/hooks/use-toast";
import { useHealthDataCache } from "@/contexts/HealthDataCacheContext";
import { medicationServiceV2 } from "@/services/medicationServiceV2";
import { logger } from "@/utils/logger";
import { MedicationWithDoses } from "@/types/medication";
import { findDoseToAct } from "@/utils/medicationStatusUtils";

export const useMedicationRemindersV2 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lastUpdated, triggerRefetch } = useHealthDataCache();
  
  const [medications, setMedications] = useState<MedicationWithDoses[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMedications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      logger.debug("Carregando medicamentos", "loadMedications", { userId: user.id });
      const data = await medicationServiceV2.getMedicationReminders();
      setMedications(data);
      logger.debug("Medicamentos carregados com sucesso", "loadMedications", {
        count: data.length
      });
    } catch (error) {
      logger.error("Erro ao carregar medicamentos", "useMedicationRemindersV2", error);
      toast({
        title: "Erro ao carregar medicamentos",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
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

    // Atualização otimista
    setMedications(prevMeds => 
      prevMeds.map(med => {
        if (med.id === medicationId) {
          const updatedDoses = med.today_doses?.map(dose =>
            dose.id === doseToAct.id ? { ...dose, status: 'taken' as const } : dose
          ) || [];
          
          return {
            ...med,
            today_doses: updatedDoses
          };
        }
        return med;
      })
    );

    // Feedback imediato
    toast({
      title: "Dose marcada como tomada!",
      description: "Parabéns por manter sua medicação em dia."
    });

    try {
      await medicationServiceV2.markDoseAsTaken(doseToAct.id);
      // Recarregar dados para garantir sincronização
      await loadMedications();
    } catch (error) {
      logger.error("Erro ao marcar dose como tomada", "markAsTaken", error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um erro ao salvar as alterações. Atualizando dados...",
        variant: "destructive"
      });
      // Reverter estado otimista
      await loadMedications();
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

    // Atualização otimista
    setMedications(prevMeds => 
      prevMeds.map(med => {
        if (med.id === medicationId) {
          const updatedDoses = med.today_doses?.map(dose =>
            dose.id === doseToAct.id ? { ...dose, status: 'skipped' as const } : dose
          ) || [];
          
          return {
            ...med,
            today_doses: updatedDoses
          };
        }
        return med;
      })
    );

    // Feedback imediato
    toast({
      title: "Dose marcada como pulada",
      description: "Lembre-se de não pular doses sem orientação médica."
    });

    try {
      await medicationServiceV2.markDoseAsSkipped(doseToAct.id);
      // Recarregar dados para garantir sincronização
      await loadMedications();
    } catch (error) {
      logger.error("Erro ao marcar dose como pulada", "markAsSkipped", error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um erro ao salvar as alterações. Atualizando dados...",
        variant: "destructive"
      });
      // Reverter estado otimista
      await loadMedications();
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
      
      triggerRefetch();
      return newMedication;
    } catch (error) {
      logger.error("Erro ao criar medicamento", "createMedication", error);
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
      triggerRefetch();
    } catch (error) {
      logger.error("Erro ao atualizar medicamento", "updateMedication", error);
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
      triggerRefetch();
    } catch (error) {
      logger.error("Erro ao deletar medicamento", "deleteMedication", error);
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

  useEffect(() => {
    loadMedications();
  }, [loadMedications, lastUpdated]);

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
