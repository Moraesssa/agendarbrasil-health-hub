
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { medicationService } from '@/services/medicationService';
import { 
  MedicationWithDoses,
  MedicationDose,
  CreateMedicationData,
  PendingDoseDisplay
} from '@/types/medication';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useMedicationManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [medications, setMedications] = useState<MedicationWithDoses[]>([]);
  const [todayDoses, setTodayDoses] = useState<MedicationDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMedicationData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load medications and today's doses
      const [medicationsData, dosesData] = await Promise.all([
        medicationService.getMedicationReminders(),
        medicationService.getDosesForDate(new Date().toISOString().split('T')[0])
      ]);

      setMedications(medicationsData);
      setTodayDoses(dosesData);
    } catch (error) {
      logger.error("Error loading medication data", "useMedicationManagement", error);
      toast({
        title: "Erro ao carregar medicamentos",
        description: "Não foi possível carregar os dados dos medicamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMedication = async (medicationData: CreateMedicationData) => {
    try {
      setIsSubmitting(true);
      await medicationService.createMedicationReminder(medicationData);
      await loadMedicationData(); // Reload data
      toast({
        title: "Medicamento adicionado",
        description: "O medicamento foi adicionado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error creating medication", "useMedicationManagement", error);
      toast({
        title: "Erro ao adicionar medicamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const markDoseAsTaken = async (doseId: string, notes?: string) => {
    try {
      await medicationService.markDoseAsTaken(doseId, notes);
      await loadMedicationData(); // Reload data
      toast({
        title: "Dose marcada",
        description: "A dose foi marcada como tomada",
      });
      return true;
    } catch (error) {
      logger.error("Error marking dose as taken", "useMedicationManagement", error);
      toast({
        title: "Erro ao marcar dose",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteMedication = async (medicationId: string) => {
    try {
      setIsSubmitting(true);
      await medicationService.deleteMedicationReminder(medicationId);
      await loadMedicationData(); // Reload data
      toast({
        title: "Medicamento removido",
        description: "O medicamento foi removido com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error deleting medication", "useMedicationManagement", error);
      toast({
        title: "Erro ao remover medicamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get pending doses with status information
  const getPendingDoses = (): PendingDoseDisplay[] => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = now.toISOString().split('T')[0];
    
    return medications.flatMap(medication => {
      return (medication.todayDoses || []).map(dose => {
        let status: PendingDoseDisplay['status'] = 'pendente';
        let nextDose = 'hoje';
        
        // Check if the dose was already taken
        if (dose.status === 'taken') {
          status = 'tomado';
          nextDose = 'amanhã';
        } else if (dose.status === 'pending') {
          // Only check timing for pending doses
          if (dose.scheduled_date === today) {
            if (dose.scheduled_time < currentTime) {
              status = 'atrasado';
              nextDose = 'agora';
            } else {
              status = 'pendente';
              const timeDiff = getTimeDifference(dose.scheduled_time, currentTime);
              nextDose = timeDiff;
            }
          }
        } else if (dose.status === 'missed') {
          status = 'atrasado';
          nextDose = 'perdido';
        } else if (dose.status === 'skipped') {
          // Don't show skipped doses
          return null;
        }
        
        return {
          id: dose.id,
          name: medication.medication_name,
          dosage: medication.dosage,
          time: dose.scheduled_time,
          status,
          frequency: medication.frequency,
          nextDose,
          reminderId: medication.id
        };
      }).filter(Boolean); // Remove null entries (skipped doses)
    }).sort((a, b) => {
      // Sort by status priority first (taken last), then by time
      const statusOrder = { 'atrasado': 0, 'pendente': 1, 'tomado': 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      return a.time.localeCompare(b.time);
    });
  };

  const getTimeDifference = (scheduledTime: string, currentTime: string) => {
    const scheduled = new Date(`2000-01-01T${scheduledTime}`);
    const current = new Date(`2000-01-01T${currentTime}`);
    const diffMs = scheduled.getTime() - current.getTime();
    
    if (diffMs <= 0) {
      return 'agora';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `em ${diffHours}h ${diffMinutes}min`;
    } else if (diffMinutes > 0) {
      return `em ${diffMinutes}min`;
    } else {
      return 'agora';
    }
  };

  useEffect(() => {
    loadMedicationData();
  }, [user]);

  return {
    medications,
    todayDoses,
    pendingDoses: getPendingDoses(),
    loading,
    isSubmitting,
    createMedication,
    markDoseAsTaken,
    deleteMedication,
    refetch: loadMedicationData
  };
};
