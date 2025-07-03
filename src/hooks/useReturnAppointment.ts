
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { newAppointmentService, LocalComHorarios } from "@/services/newAppointmentService";
import { logger } from "@/utils/logger";

interface Patient {
  id: string;
  display_name: string;
  email: string;
  last_consultation: string;
  consultation_count: number;
}

export const useReturnAppointment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedLocal, setSelectedLocal] = useState<LocalComHorarios | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableSlots, setAvailableSlots] = useState<LocalComHorarios[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetSelection = useCallback((level: 'time') => {
    if (level === 'time') {
      setSelectedTime("");
      setSelectedLocal(null);
      setAvailableSlots([]);
    }
  }, []);

  // Load patients with consultation history
  useEffect(() => {
    if (!user) return;
    
    const loadPatients = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('consultas')
          .select(`
            paciente_id,
            data_consulta,
            profiles!consultas_paciente_id_fkey(
              id,
              display_name,
              email
            )
          `)
          .eq('medico_id', user.id)
          .eq('status', 'realizada')
          .order('data_consulta', { ascending: false });

        if (error) throw error;

        // Group by patient and get consultation stats
        const patientMap = new Map<string, Patient>();
        
        data?.forEach(consulta => {
          const patientId = consulta.paciente_id;
          const profile = consulta.profiles;
          
          if (profile && !patientMap.has(patientId)) {
            patientMap.set(patientId, {
              id: patientId,
              display_name: profile.display_name || profile.email,
              email: profile.email,
              last_consultation: consulta.data_consulta,
              consultation_count: 1
            });
          } else if (profile && patientMap.has(patientId)) {
            const patient = patientMap.get(patientId)!;
            patient.consultation_count += 1;
            // Keep the most recent consultation date
            if (new Date(consulta.data_consulta) > new Date(patient.last_consultation)) {
              patient.last_consultation = consulta.data_consulta;
            }
          }
        });

        const patientsList = Array.from(patientMap.values());
        setPatients(patientsList);
        
      } catch (e) {
        logger.error("Erro ao carregar pacientes", "useReturnAppointment", e);
        toast({
          title: "Erro ao carregar pacientes",
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatients();
  }, [user, toast]);

  // Load available slots when doctor and date are selected
  useEffect(() => {
    if (!user || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    
    const loadSlots = async () => {
      setIsLoading(true);
      try {
        const slots = await newAppointmentService.getAvailableSlotsByDoctor(user.id, selectedDate);
        setAvailableSlots(slots);
        
        if (slots.length === 0) {
          toast({
            title: "Nenhum horário disponível",
            description: `Não há horários disponíveis para a data ${selectedDate}`,
            variant: "default"
          });
        }
      } catch (e) {
        toast({
          title: "Erro ao carregar horários",
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSlots();
  }, [user, selectedDate, toast]);

  const handleScheduleReturn = useCallback(async () => {
    if (!user || !selectedPatient || !selectedDate || !selectedTime || !selectedLocal) return;
    
    setIsSubmitting(true);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const localTexto = `${selectedLocal.nome_local} - ${selectedLocal.endereco.logradouro}, ${selectedLocal.endereco.numero}`;

      await newAppointmentService.scheduleAppointment({
        paciente_id: selectedPatient.id,
        medico_id: user.id,
        data_consulta: appointmentDateTime,
        tipo_consulta: 'Retorno',
        local_id: selectedLocal.id,
        local_consulta_texto: localTexto,
      });

      toast({ 
        title: "Retorno agendado com sucesso!",
        description: `Consulta de retorno marcada para ${selectedPatient.display_name}`
      });
      navigate("/agenda-medico");
    } catch (error) {
      toast({ 
        title: "Erro ao agendar retorno", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedPatient, selectedDate, selectedTime, selectedLocal, navigate, toast]);

  return {
    models: { 
      selectedPatient,
      selectedDate, 
      selectedTime, 
      selectedLocal,
      patients,
      availableSlots
    },
    setters: { 
      setSelectedPatient,
      setSelectedDate, 
      setSelectedTime, 
      setSelectedLocal
    },
    state: { isLoading, isSubmitting },
    actions: { handleScheduleReturn, resetSelection }
  };
};
