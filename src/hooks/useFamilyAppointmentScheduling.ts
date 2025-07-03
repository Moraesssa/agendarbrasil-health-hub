import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { newAppointmentService, LocalComHorarios, Medico } from "@/services/newAppointmentService";
import { familyAppointmentService } from "@/services/familyAppointmentService";
import { useFamilyManagement } from "@/hooks/useFamilyManagement";
import { logger } from "@/utils/logger";

interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useFamilyAppointmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { familyMembers } = useFamilyManagement();

  // Appointment form state
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedLocal, setSelectedLocal] = useState<LocalComHorarios | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState(""); // New: who the appointment is for

  // Data state
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [locaisComHorarios, setLocaisComHorarios] = useState<LocalComHorarios[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize patient selection to current user
  useEffect(() => {
    if (user && !selectedPatientId) {
      setSelectedPatientId(user.id);
    }
  }, [user, selectedPatientId]);

  const resetSelection = useCallback((level: 'state' | 'city' | 'doctor' | 'date') => {
    if (level === 'state') {
      setSelectedCity("");
      setDoctors([]);
      setSelectedDoctor("");
    }
    if (level === 'city') {
      setDoctors([]);
      setSelectedDoctor("");
    }
    if (level === 'doctor') {
      setSelectedDate("");
    }
    if (level === 'date') {
      setSelectedTime("");
      setSelectedLocal(null);
      setLocaisComHorarios([]);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (!user) return;
    
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const specialtiesData = await newAppointmentService.getSpecialties();
        const statesResponse = await supabase.rpc('get_available_states');
        const statesData = statesResponse.data || [];
        
        setSpecialties(specialtiesData);
        setStates(statesData as StateInfo[]);
        
        if (statesData.length === 0) {
          toast({
            title: "Atenção",
            description: "Nenhum estado com médicos disponíveis foi encontrado.",
            variant: "default"
          });
        }
      } catch (e) {
        logger.error("Erro ao carregar dados iniciais", "useFamilyAppointmentScheduling", e);
        toast({ 
          title: "Erro ao carregar dados iniciais", 
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [toast, user]);

  // Load cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }
    
    const loadCities = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_available_cities', { state_uf: selectedState });
        if (error) throw error;
        setCities(data || []);
      } catch (e) {
        toast({
          title: "Erro ao carregar cidades",
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadCities();
  }, [selectedState, toast]);

  // Load doctors when specialty, city, or state changes
  useEffect(() => {
    if (!selectedSpecialty || !selectedCity || !selectedState) {
      setDoctors([]);
      return;
    }
    
    const loadDoctors = async () => {
      setIsLoading(true);
      try {
        const doctorsData = await newAppointmentService.getDoctorsByLocationAndSpecialty(
          selectedSpecialty, 
          selectedCity, 
          selectedState
        );
        setDoctors(doctorsData);
        
        if (doctorsData.length === 0) {
          toast({
            title: "Nenhum médico encontrado",
            description: `Não há médicos de ${selectedSpecialty} em ${selectedCity}/${selectedState}`,
            variant: "default"
          });
        }
      } catch (e) {
        toast({
          title: "Erro ao carregar médicos",
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadDoctors();
  }, [selectedSpecialty, selectedCity, selectedState, toast]);
  
  // Load time slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setLocaisComHorarios([]);
      return;
    }
    
    const loadSlots = async () => {
      setIsLoading(true);
      try {
        const slots = await newAppointmentService.getAvailableSlotsByDoctor(selectedDoctor, selectedDate);
        setLocaisComHorarios(slots);
        
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
  }, [selectedDoctor, selectedDate, toast]);

  const handleAgendamento = useCallback(async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !selectedLocal || !selectedPatientId) return;
    
    setIsSubmitting(true);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      // Check if scheduling for family member or self
      if (selectedPatientId === user.id) {
        // Scheduling for self - use regular appointment service
        const localTexto = `${selectedLocal.nome_local} - ${selectedLocal.endereco.logradouro}, ${selectedLocal.endereco.numero}`;
        
        await newAppointmentService.scheduleAppointment({
          paciente_id: user.id,
          medico_id: selectedDoctor,
          data_consulta: appointmentDateTime,
          tipo_consulta: selectedSpecialty,
          local_id: selectedLocal.id,
          local_consulta_texto: localTexto,
        });
      } else {
        // Scheduling for family member - use family appointment service
        await familyAppointmentService.scheduleFamilyAppointment({
          paciente_id: selectedPatientId,
          medico_id: selectedDoctor,
          data_consulta: appointmentDateTime,
          tipo_consulta: selectedSpecialty,
          agendado_por: user.id
        });
      }

      const selectedMember = familyMembers.find(m => m.family_member_id === selectedPatientId);
      const patientName = selectedPatientId === user.id ? "você" : selectedMember?.display_name || "paciente";
      
      toast({ title: `Consulta agendada com sucesso para ${patientName}!` });
      navigate("/agenda-paciente");
    } catch (error) {
      toast({ 
        title: "Erro ao agendar", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedDoctor, selectedDate, selectedTime, selectedSpecialty, selectedLocal, selectedPatientId, familyMembers, navigate, toast]);

  return {
    models: { 
      selectedSpecialty, 
      selectedState, 
      selectedCity, 
      selectedDoctor, 
      selectedDate, 
      selectedTime, 
      selectedLocal,
      selectedPatientId,
      specialties, 
      states, 
      cities, 
      doctors, 
      locaisComHorarios,
      familyMembers
    },
    setters: { 
      setSelectedSpecialty, 
      setSelectedState, 
      setSelectedCity, 
      setSelectedDoctor, 
      setSelectedDate, 
      setSelectedTime, 
      setSelectedLocal,
      setSelectedPatientId
    },
    state: { isLoading, isSubmitting },
    actions: { handleAgendamento, resetSelection }
  };
};