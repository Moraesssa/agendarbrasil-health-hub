
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { medicationService, MedicationReminder } from "@/services/medicationService";
import { logger } from "@/utils/logger";

export const useMedicationManagement = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMedication = async (medication: Omit<MedicationReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    try {
      logger.debug("Iniciando criação de medicamento", "createMedication", { 
        medication_name: medication.medication_name,
        times: medication.times
      });
      
      // Cria o medicamento e obtém o objeto completo com ID
      const newMedication = await medicationService.createMedicationReminder(medication);
      
      // Mostrar toast imediatamente para feedback do usuário
      toast({
        title: "Medicamento adicionado!",
        description: `${medication.medication_name} foi adicionado aos seus lembretes.`
      });
      
      // Garantir que a lista completa seja recarregada para incluir novas doses
      const updatedMedications = await medicationService.getMedicationReminders();
      
      logger.debug("Medicamento criado com sucesso", "createMedication", {
        id: newMedication.id,
        updatedCount: updatedMedications.length
      });
      
      return { newMedication, updatedMedications };
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
  };

  const updateMedication = async (id: string, updates: Partial<MedicationReminder>) => {
    setIsSubmitting(true);
    try {
      await medicationService.updateMedicationReminder(id, updates);
      toast({
        title: "Medicamento atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
      
      const updatedMedications = await medicationService.getMedicationReminders();
      return updatedMedications;
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
  };

  const deleteMedication = async (id: string) => {
    setIsSubmitting(true);
    try {
      await medicationService.deleteMedicationReminder(id);
      toast({
        title: "Medicamento removido",
        description: "O lembrete foi removido com sucesso."
      });
      
      const updatedMedications = await medicationService.getMedicationReminders();
      return updatedMedications;
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
  };

  return {
    createMedication,
    updateMedication,
    deleteMedication,
    isSubmitting
  };
};
