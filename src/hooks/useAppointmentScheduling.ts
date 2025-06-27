import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { appointmentService } from "@/services/appointmentService"; // Importe o serviço

// --- Interfaces ---
interface Doctor { id: string; display_name: string | null; }
interface TimeSlot { time: string; available: boolean; }
interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useAppointmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>("");

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSpecialties = useCallback(async () => {
    setIsLoadingSpecialties(true);
    try {
      const data = await appointmentService.getSpecialties();
      setSpecialties(data);
    } catch (e) { toast({ title: "Erro ao carregar especialidades", variant: "destructive" }); }
    finally { setIsLoadingSpecialties(false); }
  }, [toast]);
  
  // ... (manter as outras funções de carregamento) ...

  const loadAvailableTimeSlots = useCallback(async (doctorId: string, date: string) => {
    setIsLoadingTimeSlots(true);
    try {
      const slots = await appointmentService.getAvailableTimeSlots(doctorId, date);
      setAvailableTimeSlots(slots);
    } catch (error) {
      toast({ title: "Erro ao buscar horários", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingTimeSlots(false);
    }
  }, [toast]);
  
  const handleAgendamento = useCallback(async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !selectedSpecialty) return;
    setIsSubmitting(true);
    try {
      // **CORREÇÃO PRINCIPAL AQUI**
      // Cria a data e hora sem fuso horário, para que o Supabase interprete corretamente.
      const appointmentDateTime = `${selectedDate} ${selectedTime}:00`;

      await appointmentService.scheduleAppointment({
        paciente_id: user.id,
        medico_id: selectedDoctor,
        data_consulta: appointmentDateTime,
        tipo_consulta: selectedSpecialty,
      });

      toast({ title: "Consulta agendada com sucesso!", description: "Você será redirecionado para a sua agenda." });
      navigate("/agenda-paciente");
    } catch (error) {
      toast({ title: "Erro ao agendar consulta", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedDoctor, selectedDate, selectedTime, selectedSpecialty, navigate, toast]);
  
    const loadAvailableStates = useCallback(async () => {
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase.rpc('get_available_states');
      if (error) throw error;
      setStates(data || []);
    } catch (e) { toast({ title: "Erro ao carregar estados", variant: "destructive" }); }
    finally { setIsLoadingLocations(false); }
  }, [toast]);

  const loadAvailableCities = useCallback(async (stateUf: string) => {
    setIsLoadingLocations(true);
    setCities([]);
    try {
      const { data, error } = await supabase.rpc('get_available_cities', { state_uf: stateUf });
      if (error) throw error;
      setCities(data || []);
    } catch (e) { toast({ title: "Erro ao carregar cidades", variant: "destructive" }); }
    finally { setIsLoadingLocations(false); }
  }, [toast]);

  const loadDoctors = useCallback(async (specialty: string, state: string, city: string) => {
    setIsLoadingDoctors(true);
    setDoctors([]);
    try {
      const data = await appointmentService.getDoctorsBySpecialty(specialty);
      setDoctors(data);
    } catch (e) { toast({ title: "Erro ao carregar médicos", variant: "destructive" }); }
    finally { setIsLoadingDoctors(false); }
  }, [toast]);

  // --- useEffects ---
  useEffect(() => { loadSpecialties(); loadAvailableStates(); }, [loadSpecialties, loadAvailableStates]);
  
  useEffect(() => {
    setSelectedCity('');
    if (selectedState) loadAvailableCities(selectedState);
  }, [selectedState, loadAvailableCities]);

  useEffect(() => {
    setSelectedDoctor('');
    if (selectedSpecialty && selectedState && selectedCity) {
      loadDoctors(selectedSpecialty, selectedState, selectedCity);
    }
  }, [selectedSpecialty, selectedState, selectedCity, loadDoctors]);

  useEffect(() => {
    setSelectedDate('');
  }, [selectedDoctor]);

  useEffect(() => {
    setSelectedTime('');
    setAvailableTimeSlots([]);
    if (selectedDoctor && selectedDate) {
      loadAvailableTimeSlots(selectedDoctor, selectedDate);
    }
  }, [selectedDoctor, selectedDate, loadAvailableTimeSlots]);

  // --- Handlers ---
  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctorName(doctor?.display_name || '');
    setSelectedDoctor(doctorId);
  };

  return {
    selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedDoctorName,
    specialties, states, cities,
    doctors: doctors.map(d => ({ id: d.id, display_name: d.display_name || "Médico" })),
    availableTimeSlots,
    isLoadingSpecialties, isLoadingLocations, isLoadingDoctors, isLoadingTimeSlots, isSubmitting,
    handleSpecialtyChange: setSelectedSpecialty,
    handleStateChange: setSelectedState,
    handleCityChange: setSelectedCity,
    handleDoctorChange,
    handleDateChange: setSelectedDate,
    setSelectedTime,
    handleAgendamento,
  };
};