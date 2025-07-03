
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { medicationService, MedicationWithDoses } from "@/services/medicationService";
import { logger } from "@/utils/logger";
import { useMedicationActions } from "./useMedicationActions";
import { useMedicationManagement } from "./useMedicationManagement";

export const useMedicationReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [medications, setMedications] = useState<MedicationWithDoses[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMedications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      logger.debug("Carregando medicamentos", "loadMedications", { userId: user.id });
      const data = await medicationService.getMedicationReminders();
      setMedications(data);
      logger.debug("Medicamentos carregados com sucesso", "loadMedications", {
        count: data.length,
        medications: data.map(m => ({
          id: m.id,
          name: m.medication_name,
          dosesCount: m.today_doses?.length || 0
        }))
      });
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

  // Use the medication actions hook
  const { markAsTaken, markAsSkipped, isSubmitting: actionsSubmitting } = useMedicationActions({
    medications,
    setMedications,
    loadMedications
  });

  // Use the medication management hook
  const { 
    createMedication: createMedicationBase, 
    updateMedication: updateMedicationBase, 
    deleteMedication: deleteMedicationBase,
    isSubmitting: managementSubmitting
  } = useMedicationManagement();

  // Wrapper functions to handle state updates
  const createMedication = async (medication: Parameters<typeof createMedicationBase>[0]) => {
    const result = await createMedicationBase(medication);
    setMedications(result.updatedMedications);
    return result.newMedication;
  };

  const updateMedication = async (id: string, updates: Parameters<typeof updateMedicationBase>[1]) => {
    const updatedMedications = await updateMedicationBase(id, updates);
    setMedications(updatedMedications);
  };

  const deleteMedication = async (id: string) => {
    const updatedMedications = await deleteMedicationBase(id);
    setMedications(updatedMedications);
  };

  useEffect(() => {
    loadMedications();
  }, [user]);

  return {
    medications,
    isLoading,
    isSubmitting: actionsSubmitting || managementSubmitting,
    loadMedications,
    createMedication,
    updateMedication,
    deleteMedication,
    markAsTaken,
    markAsSkipped
  };
};
