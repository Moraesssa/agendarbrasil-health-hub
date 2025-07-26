
import { useState } from 'react';
import { familyAppointmentService } from '@/services/familyAppointmentService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useFamilyAppointmentScheduling = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const scheduleFamilyAppointment = async (appointmentData: {
    paciente_id: string;
    medico_id: string;
    consultation_date: string;
    consultation_type: string;
    notes?: string;
  }) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await familyAppointmentService.scheduleFamilyAppointment({
        ...appointmentData,
        scheduled_by: user.id
      });

      if (result.success) {
        toast.success("Consulta agendada com sucesso para familiar!");
        return { success: true };
      } else {
        throw new Error("Erro ao agendar consulta");
      }
    } catch (error) {
      console.error('Erro ao agendar consulta familiar:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao agendar consulta");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    scheduleFamilyAppointment,
    loading
  };
};
