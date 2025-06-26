
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

// --- Interfaces ---
interface Doctor {
  id: string;
  user_id: string;
  especialidades: string[];
  profiles: { display_name: string | null; } | null;
}
interface TimeSlot { time: string; available: boolean; }
interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useAppointmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- Estados ---
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

  // --- Funções de Carregamento ---
  const loadSpecialties = useCallback(async () => {
    setIsLoadingSpecialties(true);
    try {
      const { data, error } = await supabase.rpc('get_all_specialties');
      if (error) throw error;
      // A RPC agora retorna diretamente um array de strings
      setSpecialties(data || []);
    } catch (e) { 
      toast({ title: "Erro ao carregar especialidades", variant: "destructive" }); 
    }
    finally { setIsLoadingSpecialties(false); }
  }, [toast]);

  const loadAvailableStates = useCallback(async () => {
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase.rpc('get_available_states');
      if (error) throw error;
      setStates(data || []);
    } catch (e) { 
      toast({ title: "Erro ao carregar estados", variant: "destructive" }); 
    }
    finally { setIsLoadingLocations(false); }
  }, [toast]);

  const loadAvailableCities = useCallback(async (stateUf: string) => {
    setIsLoadingLocations(true);
    setCities([]);
    try {
      const { data, error } = await supabase.rpc('get_available_cities', { state_uf: stateUf });
      if (error) throw error;
      setCities(data || []);
    } catch (e) { 
      toast({ title: "Erro ao carregar cidades", variant: "destructive" }); 
    }
    finally { setIsLoadingLocations(false); }
  }, [toast]);

  const loadDoctors = useCallback(async (specialty: string, state: string, city: string) => {
    setIsLoadingDoctors(true);
    setDoctors([]);
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select(`id, user_id, especialidades, profiles!medicos_user_id_fkey(display_name)`)
        .contains('especialidades', [specialty])
        .eq('endereco->>uf', state)
        .eq('endereco->>cidade', city);
      if (error) throw error;
      console.log(`👨‍⚕️ Médicos encontrados:`, data);
      setDoctors((Array.isArray(data) ? data : [data].filter(Boolean)) as Doctor[]);
    } catch (e) { 
      toast({ title: "Erro ao carregar médicos", variant: "destructive" }); 
    }
    finally { setIsLoadingDoctors(false); }
  }, [toast]);

  const loadAvailableTimeSlots = useCallback(async (doctorId: string, date: string) => {
    console.log(`🔍 Buscando horários para Dr(a) ${doctorId} em ${date}...`);
    setIsLoadingTimeSlots(true);
    setAvailableTimeSlots([]);
    try {
        const { data: existingAppointments, error } = await supabase
            .from('consultas')
            .select('data_consulta')
            .eq('medico_id', doctorId)
            .gte('data_consulta', `${date}T00:00:00Z`)
            .lte('data_consulta', `${date}T23:59:59Z`)
            .in('status', ['agendada', 'confirmada']);
        if (error) throw error;

        const defaultTimeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
        const occupiedTimes = existingAppointments.map(apt => format(new Date(apt.data_consulta), 'HH:mm'));

        const slots = defaultTimeSlots.map(time => ({
            time,
            available: !occupiedTimes.includes(time)
        }));
        setAvailableTimeSlots(slots);
    } catch (error) {
        toast({ title: "Erro ao buscar horários", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsLoadingTimeSlots(false);
    }
  }, [toast]);

  const handleAgendamento = useCallback(async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      const appointmentDateTime = `${selectedDate}T${selectedTime}:00`;
      const { error } = await supabase.from('consultas').insert({
        paciente_id: user.id,
        medico_id: selectedDoctor,
        data_consulta: appointmentDateTime,
        tipo_consulta: selectedSpecialty,
        status: 'agendada',
      });
      if (error) throw error;
      toast({ title: "Consulta agendada com sucesso!", description: "Você será redirecionado para a sua agenda." });
      navigate("/agenda-paciente");
    } catch (error) {
      toast({ title: "Erro ao agendar consulta", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedDoctor, selectedDate, selectedTime, selectedSpecialty, navigate, toast]);

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
    const doctor = doctors.find(d => d.user_id === doctorId);
    setSelectedDoctorName(doctor?.profiles?.display_name || '');
    setSelectedDoctor(doctorId);
  };

  return {
    selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedDoctorName,
    specialties, states, cities,
    doctors: doctors.map(d => ({ id: d.user_id, display_name: d.profiles?.display_name || "Médico" })),
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
