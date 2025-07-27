
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { newAppointmentService, LocalComHorarios, Medico } from "@/services/newAppointmentService";
import { logger } from "@/utils/logger";

interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useNewAppointmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedLocal, setSelectedLocal] = useState<LocalComHorarios | null>(null);

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [locaisComHorarios, setLocaisComHorarios] = useState<LocalComHorarios[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const specialtiesData = await newAppointmentService.getSpecialties();
        console.log("✅ Especialidades carregadas:", specialtiesData.length);
        
        const statesResponse = await supabase.rpc('get_available_states');
        const statesData = statesResponse.data || [];
        console.log("✅ Estados carregados:", statesData.length);
        
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
        console.error("❌ Erro ao carregar dados iniciais:", e);
        logger.error("Erro ao carregar dados iniciais", "useNewAppointmentScheduling", e);
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
        console.log("✅ Cidades carregadas para", selectedState, ":", data?.length || 0);
        setCities(data || []);
      } catch (e) {
        console.error("❌ Erro ao carregar cidades:", e);
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
        console.log("✅ Médicos encontrados:", doctorsData.length);
        setDoctors(doctorsData);
        
        if (doctorsData.length === 0) {
          toast({
            title: "Nenhum médico encontrado",
            description: `Não há médicos de ${selectedSpecialty} em ${selectedCity}/${selectedState}`,
            variant: "default"
          });
        }
      } catch (e) {
        console.error("❌ Erro ao carregar médicos:", e);
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
  
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setLocaisComHorarios([]);
      return;
    }
    
    const loadSlots = async () => {
      setIsLoading(true);
      try {
        const slots = await newAppointmentService.getAvailableSlotsByDoctor(selectedDoctor, selectedDate);
        console.log("✅ Slots encontrados:", slots.length);
        setLocaisComHorarios(slots);
        
        if (slots.length === 0) {
          toast({
            title: "Nenhum horário disponível",
            description: `Não há horários disponíveis para a data ${selectedDate}`,
            variant: "default"
          });
        }
      } catch (e) {
        console.error("❌ Erro ao carregar horários:", e);
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
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !selectedLocal) return;
    setIsSubmitting(true);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const localTexto = `${selectedLocal.nome_local} - ${selectedLocal.endereco.logradouro}, ${selectedLocal.endereco.numero}`;

      await newAppointmentService.scheduleAppointment({
        paciente_id: user.id,
        medico_id: selectedDoctor,
        consultation_date: appointmentDateTime,
        consultation_type: selectedSpecialty,
        local_consulta_texto: localTexto,
      });

      toast({ title: "Consulta agendada com sucesso!" });
      navigate("/agenda-paciente");
    } catch (error) {
      toast({ title: "Erro ao agendar", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedDoctor, selectedDate, selectedTime, selectedSpecialty, selectedLocal, navigate, toast]);

  return {
    models: { selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedLocal, specialties, states, cities, doctors, locaisComHorarios },
    setters: { setSelectedSpecialty, setSelectedState, setSelectedCity, setSelectedDoctor, setSelectedDate, setSelectedTime, setSelectedLocal },
    state: { isLoading, isSubmitting },
    actions: { handleAgendamento, resetSelection }
  };
};
