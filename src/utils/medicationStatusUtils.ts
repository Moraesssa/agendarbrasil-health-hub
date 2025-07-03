
import { MedicationWithDoses, MedicationDose } from "@/types/medication";
import { logger } from "@/utils/logger";

export const calculateMedicationStatus = (
  medication: MedicationWithDoses
): 'pending' | 'taken' | 'completed' | 'partial' | 'overdue' => {
  const doses = medication.today_doses || [];
  
  if (doses.length === 0) {
    return 'pending';
  }

  const takenDoses = doses.filter(d => d.status === 'taken').length;
  const skippedDoses = doses.filter(d => d.status === 'skipped').length;
  const pendingDoses = doses.filter(d => d.status === 'pending').length;
  
  // Se todas as doses foram tomadas
  if (takenDoses === doses.length) {
    return 'completed';
  }
  
  // Se todas as doses foram tomadas ou puladas
  if (takenDoses + skippedDoses === doses.length) {
    return 'completed';
  }
  
  // Se tem doses pendentes, verificar se alguma está atrasada
  if (pendingDoses > 0) {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    
    const overdueDoses = doses.filter(dose => {
      if (dose.status !== 'pending') return false;
      
      const doseTime = dose.scheduled_time;
      const scheduledDateTime = new Date(`1970-01-01T${doseTime}:00`);
      const currentDateTime = new Date(`1970-01-01T${currentTime}:00`);
      
      // Considera atrasado se passou mais de 30 minutos do horário
      const diffMinutes = (currentDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60);
      return diffMinutes > 30;
    });
    
    if (overdueDoses.length > 0) {
      return 'overdue';
    }
  }
  
  // Se tem algumas doses tomadas, mas não todas
  if (takenDoses > 0) {
    return 'partial';
  }
  
  return 'pending';
};

export const calculateMedicationProgress = (medication: MedicationWithDoses) => {
  const doses = medication.today_doses || [];
  const total = doses.length;
  const taken = doses.filter(d => d.status === 'taken').length;
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
  
  return {
    taken,
    total,
    percentage
  };
};

export const getNextDoseTime = (medication: MedicationWithDoses): string | null => {
  const doses = medication.today_doses || [];
  const pendingDoses = doses.filter(d => d.status === 'pending');
  
  if (pendingDoses.length === 0) {
    return null;
  }
  
  // Retorna a próxima dose pendente em ordem cronológica
  const sortedPendingDoses = pendingDoses.sort((a, b) => 
    a.scheduled_time.localeCompare(b.scheduled_time)
  );
  
  return sortedPendingDoses[0].scheduled_time;
};

export const findDoseToAct = (medication: MedicationWithDoses): MedicationDose | null => {
  const doses = medication.today_doses || [];
  const pendingDoses = doses.filter(d => d.status === 'pending');
  
  if (pendingDoses.length === 0) {
    logger.debug("Nenhuma dose pendente encontrada", "findDoseToAct", {
      medicationId: medication.id,
      totalDoses: doses.length,
      pendingCount: pendingDoses.length
    });
    return null;
  }
  
  const now = new Date();
  const currentTime = now.toTimeString().substring(0, 5);
  
  // Primeiro, procura por uma dose que deveria ter sido tomada (até 30 min de atraso)
  const currentOrOverdueDose = pendingDoses.find(dose => {
    const doseTime = dose.scheduled_time;
    const scheduledDateTime = new Date(`1970-01-01T${doseTime}:00`);
    const currentDateTime = new Date(`1970-01-01T${currentTime}:00`);
    const diffMinutes = (currentDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60);
    
    // Retorna doses que já passaram da hora ou estão próximas (dentro de 15 min)
    return diffMinutes >= -15;
  });
  
  if (currentOrOverdueDose) {
    return currentOrOverdueDose;
  }
  
  // Se não há dose atual, retorna a próxima dose pendente
  const sortedPendingDoses = pendingDoses.sort((a, b) => 
    a.scheduled_time.localeCompare(b.scheduled_time)
  );
  
  return sortedPendingDoses[0];
};
