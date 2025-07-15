
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface MedicationContextType {
  medications: MedicationWithDoses[];
  todayDoses: MedicationDose[];
  pendingDoses: PendingDoseDisplay[];
  loading: boolean;
  isSubmitting: boolean;
  createMedication: (data: CreateMedicationData) => Promise<boolean>;
  editMedication: (medicationId: string, data: CreateMedicationData) => Promise<boolean>;
  markDoseAsTaken: (doseId: string, notes?: string) => Promise<boolean>;
  deleteMedication: (medicationId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const useMedicationContext = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedicationContext must be used within a MedicationProvider');
  }
  return context;
};

interface MedicationProviderProps {
  children: ReactNode;
}

export const MedicationProvider: React.FC<MedicationProviderProps> = ({ children }) => {
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
      
      const [medicationsData, dosesData] = await Promise.all([
        medicationService.getMedicationReminders(),
        medicationService.getDosesForDate(new Date().toISOString().split('T')[0])
      ]);

      setMedications(medicationsData);
      setTodayDoses(dosesData);
    } catch (error) {
      logger.error("Error loading medication data", "MedicationContext", error);
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
      await loadMedicationData();
      toast({
        title: "Medicamento adicionado",
        description: "O medicamento foi adicionado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error creating medication", "MedicationContext", error);
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

  const editMedication = async (medicationId: string, medicationData: CreateMedicationData) => {
    try {
      setIsSubmitting(true);
      await medicationService.updateMedicationReminder(medicationId, medicationData);
      await loadMedicationData();
      toast({
        title: "Medicamento atualizado",
        description: "O medicamento foi atualizado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error updating medication", "MedicationContext", error);
      toast({
        title: "Erro ao atualizar medicamento",
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
      await loadMedicationData();
      toast({
        title: "Dose marcada",
        description: "A dose foi marcada como tomada",
      });
      return true;
    } catch (error) {
      logger.error("Error marking dose as taken", "MedicationContext", error);
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
      await loadMedicationData();
      toast({
        title: "Medicamento removido",
        description: "O medicamento foi removido com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error deleting medication", "MedicationContext", error);
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

  const getPendingDoses = (): PendingDoseDisplay[] => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split('T')[0];
    
    return medications.flatMap(medication => {
      return (medication.todayDoses || []).map(dose => {
        let status: PendingDoseDisplay['status'] = 'pendente';
        let nextDose = 'hoje';
        
        if (dose.status === 'taken') {
          status = 'tomado';
          nextDose = 'amanhã';
        } else if (dose.status === 'pending') {
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
      }).filter(Boolean);
    }).sort((a, b) => {
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

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const setupRealtimeSubscriptions = () => {
      const medicationRemindersChannel = supabase
        .channel('medication_reminders_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medication_reminders',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadMedicationData();
          }
        )
        .subscribe();

      const medicationDosesChannel = supabase
        .channel('medication_doses_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medication_doses'
          },
          () => {
            loadMedicationData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(medicationRemindersChannel);
        supabase.removeChannel(medicationDosesChannel);
      };
    };

    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [user]);

  useEffect(() => {
    loadMedicationData();
  }, [user]);

  const value: MedicationContextType = {
    medications,
    todayDoses,
    pendingDoses: getPendingDoses(),
    loading,
    isSubmitting,
    createMedication,
    editMedication,
    markDoseAsTaken,
    deleteMedication,
    refetch: loadMedicationData
  };

  return (
    <MedicationContext.Provider value={value}>
      {children}
    </MedicationContext.Provider>
  );
};
