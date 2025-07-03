
import { MedicationWithDoses } from "@/services/medicationService";
import { logger } from "@/utils/logger";

export const findClosestPendingDose = (doses: MedicationWithDoses['today_doses']) => {
  if (!doses || doses.length === 0) {
    logger.debug("Nenhuma dose encontrada", "findClosestPendingDose", { doses });
    return null;
  }

  const now = new Date();
  const nowInMinutes = now.getHours() * 60 + now.getMinutes();

  // Garantir que apenas doses pendentes sejam consideradas
  const pendingDoses = doses.filter(d => d.status === 'pending');
  
  logger.debug("Procurando dose pendente mais próxima", "findClosestPendingDose", {
    totalDoses: doses.length,
    pendingDoses: pendingDoses.length,
    currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
    allDoses: doses.map(d => ({ 
      id: d.id, 
      status: d.status, 
      time: d.scheduled_time,
      isPending: d.status === 'pending'
    }))
  });

  if (pendingDoses.length === 0) {
    logger.debug("Nenhuma dose pendente encontrada", "findClosestPendingDose");
    return null;
  }
  
  // Se houver apenas uma dose pendente, retorna ela
  if (pendingDoses.length === 1) {
    logger.debug("Única dose pendente encontrada", "findClosestPendingDose", {
      dose: pendingDoses[0]
    });
    return pendingDoses[0];
  }

  // Encontra a dose pendente mais próxima do horário atual
  const closestDose = pendingDoses.reduce((closest, current) => {
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
  }, pendingDoses[0]);

  logger.debug("Dose mais próxima selecionada", "findClosestPendingDose", {
    selectedDose: closestDose
  });

  return closestDose;
};
