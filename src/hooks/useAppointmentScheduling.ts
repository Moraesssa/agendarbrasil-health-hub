
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { appointmentService, type Medico } from "@/services/appointmentService";
import { type TimeSlot } from "@/utils/timeSlotUtils";
import { logger } from "@/utils/logger";

export const useAppointmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados do formulário
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Buscando especialidades
  const {
    data: specialties,
    isLoading: isLoadingSpecialties,
    isError: isErrorSpecialties,
    error: errorSpecialties
  } = useQuery<string[], Error>({
    queryKey: ['specialties'],
    queryFn: async () => {
      logger.info("Fetching specialties for appointment scheduling", "useAppointmentScheduling");
      try {
        const { data, error } = await supabase.rpc('get_specialties');
        if (error) throw error;
        return (data as string[] || []).sort();
      } catch (err) {
        logger.error("Error fetching specialties", "useAppointmentScheduling", err);
        throw err;
      }
    },
    staleTime: Infinity,
  });

  // Busca de médicos por especialidade selecionada
  const {
    data: doctors,
    isLoading: isLoadingDoctors,
    isError: isErrorDoctors,
    error: errorDoctors
  } = useQuery<Medico[], Error>({
    queryKey: ['doctors', selectedSpecialty],
    queryFn: () => {
      if (!selectedSpecialty) return [];
      return appointmentService.getDoctorsBySpecialty(selectedSpecialty);
    },
    enabled: !!selectedSpecialty,
  });

  // Busca de horários disponíveis para médico e data selecionados
  const {
    data: availableTimeSlots,
    isLoading: isLoadingTimeSlots,
    isError: isErrorTimeSlots,
    error: errorTimeSlots
  } = useQuery<TimeSlot[], Error>({
    queryKey: ['timeSlots', selectedDoctor, selectedDate],
    queryFn: () => {
      if (!selectedDoctor || !selectedDate) return [];
      return appointmentService.getAvailableTimeSlots(selectedDoctor, selectedDate);
    },
    enabled: !!selectedDoctor && !!selectedDate,
  });

  // Mutação para agendar a consulta
  const { mutate: scheduleAppointment, isPending: isSubmitting } = useMutation({
    mutationFn: appointmentService.scheduleAppointment,
    onSuccess: () => {
      toast({
        title: "Consulta Agendada!",
        description: `Sua consulta foi agendada com sucesso para ${selectedDate} às ${selectedTime}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['consultas'] }); 
      navigate("/agenda-paciente");
    },
    onError: (error: Error) => {
      console.error("Erro ao agendar consulta:", error);
      toast({
        title: "Erro no Agendamento",
        description: error.message || "Não foi possível agendar sua consulta. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Handler para resetar seleções quando especialidade muda
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTime("");
  };

  // Handler para resetar data e horário quando médico muda
  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setSelectedDate("");
    setSelectedTime("");
  };

  // Handler para resetar horário quando a data muda
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  // Handler para agendar a consulta
  const handleAgendamento = () => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para agendar.", variant: "destructive" });
      return;
    }
    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos", variant: "destructive" });
      return;
    }

    const dataHoraConsulta = new Date(`${selectedDate}T${selectedTime}:00`);
    scheduleAppointment({
      paciente_id: user.id,
      medico_id: selectedDoctor,
      data_consulta: dataHoraConsulta.toISOString(),
      tipo_consulta: selectedSpecialty
    });
  };

  const selectedDoctorName = doctors?.find(doc => doc.id === selectedDoctor)?.display_name;

  return {
    // State
    selectedSpecialty,
    selectedDoctor,
    selectedDate,
    selectedTime,
    selectedDoctorName,
    
    // Data
    specialties,
    doctors,
    availableTimeSlots,
    
    // Loading states
    isLoadingSpecialties,
    isLoadingDoctors,
    isLoadingTimeSlots,
    isSubmitting,
    
    // Error states
    isErrorSpecialties,
    isErrorDoctors,
    isErrorTimeSlots,
    errorSpecialties,
    errorDoctors,
    errorTimeSlots,
    
    // Handlers
    handleSpecialtyChange,
    handleDoctorChange,
    handleDateChange,
    setSelectedTime,
    handleAgendamento,
  };
};
