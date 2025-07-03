
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
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();
  
    // Garantir que apenas doses pendentes sejam consideradas
    const pendingDoses = doses.filter(d => d.status === 'pending');
    
    logger.debug("Doses pendentes encontradas", "findClosestPendingDose", {
      count: pendingDoses.length,
      doses: pendingDoses
    });
  
    if (pendingDoses.length === 0) return null;
    
    // Se houver apenas uma dose pendente, retorna ela
    if (pendingDoses.length === 1) return pendingDoses[0];
  
    // Encontra a dose pendente mais próxima do horário atual
    return pendingDoses.reduce((closest, current) => {
      try {
        const [closestHours, closestMinutes] = closest.scheduled_time.split(':').map(Number);
        const closestTimeInMinutes = closestHours * 60 + closestMinutes;
  
        const [currentHours, currentMinutes] = current.scheduled_time.split(':').map(Number);
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  
        const closestDiff = Math.abs(closestTimeInMinutes - nowInMinutes);
        const currentDiff = Math.abs(currentTimeInMinutes - nowInMinutes);
  
        return currentDiff < closestDiff ? current : closest;
      } catch (error) {
        logger.error("Erro ao processar horários de doses", "findClosestPendingDose", {
          error,
          closest,
          current
        });
        return closest;
      }
    }, pendingDoses[0]); // Initialize with the first pending dose
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
      logger.debug("Iniciando criação de medicamento", "createMedication", { medication_name: medication.medication_name });
      
      // Cria o medicamento e obtém o objeto completo com ID
      const newMedication = await medicationService.createMedicationReminder(medication);
      
      // Mostrar toast imediatamente para feedback do usuário
      toast({
        title: "Medicamento adicionado!",
        description: `${medication.medication_name} foi adicionado aos seus lembretes.`
      });
      
      // Garantir que a lista completa seja recarregada para incluir novas doses
      const updatedMedications = await medicationService.getMedicationReminders();
      
      // Atualizar o estado com os dados atualizados
      setMedications(updatedMedications);
      
      logger.debug("Medicamento criado com sucesso", "createMedication", {
        id: newMedication.id,
        updatedCount: updatedMedications.length
      });
      
      return newMedication;
    } catch (error) {
      logger.error("Erro ao criar medicamento", "createMedication", error);
      toast({
        title: "Erro ao adicionar medicamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
      throw error; // Re-lançar o erro para tratamento no componente
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
    // Atualizar o estado imediatamente para resposta instantânea na UI
    // Antes mesmo de fazer a chamada de API
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      toast({ title: "Erro", description: "Medicamento não encontrado.", variant: "destructive" });
      return;
    }
    
    logger.debug("Marcando medicamento como tomado", "markAsTaken", { medicationId, medication });
    
    const pendingDose = findClosestPendingDose(medication?.today_doses);
    const targetDoseId = doseId || pendingDose?.id;

    if (!targetDoseId) {
      toast({ title: "Erro", description: "Nenhuma dose pendente encontrada para marcar como tomada.", variant: "destructive" });
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
            newStatus,
            updatedDoses
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
      // Este recarregamento é silencioso (sem indicador de carregamento)
      const refreshedData = await medicationService.getMedicationReminders();
      setMedications(refreshedData);
      
      logger.debug("Dados recarregados após atualização", "markAsTaken", {
        count: refreshedData.length
      });
    } catch (error) {
      logger.error("Erro ao marcar dose como tomada", "useMedicationReminders", error);
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
    // Atualizar o estado imediatamente para resposta instantânea na UI
    const medication = medications.find(m => m.id === medicationId);
    if (!medication) {
      toast({ title: "Erro", description: "Medicamento não encontrado.", variant: "destructive" });
      return;
    }
    
    logger.debug("Marcando medicamento como pulado", "markAsSkipped", { medicationId, medication });
    
    const pendingDose = findClosestPendingDose(medication?.today_doses);
    const targetDoseId = doseId || pendingDose?.id;

    if (!targetDoseId) {
      toast({ title: "Erro", description: "Nenhuma dose pendente encontrada para pular.", variant: "destructive" });
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
            newStatus,
            updatedDoses
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
      // Este recarregamento é silencioso (sem indicador de carregamento)
      const refreshedData = await medicationService.getMedicationReminders();
      setMedications(refreshedData);
      
      logger.debug("Dados recarregados após atualização", "markAsSkipped", {
        count: refreshedData.length
      });
    } catch (error) {
      logger.error("Erro ao marcar dose como pulada", "useMedicationReminders", error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um erro ao salvar as alterações. Atualizando dados...",
        variant: "destructive"
      });
      
      // Se falhar, recarrega os dados para reverter o estado otimista
      loadMedications();
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
