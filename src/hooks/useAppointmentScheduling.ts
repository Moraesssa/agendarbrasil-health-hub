import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { specialtyService } from "@/services/specialtyService";

interface Doctor {
  id: string;
  user_id: string;
  especialidades: string[];
  telefone: string;
  crm: string;
  profiles: {
    display_name: string | null;
  } | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface StateInfo {
  uf: string;
}

interface CityInfo {
  cidade: string;
}

// NOVO: Tipagem para o retorno da função de especialidades
interface SpecialtyInfo {
  specialty: string;
}


export const useAppointmentScheduling = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados principais e dados para os seletores
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>("");

  const [specialties, setSpecialties] = useState<string[]>([]); // O estado final será um array de strings
  const [states, setStates] = useState<StateInfo[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  // Estados de loading
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeitos para carregar dados em cascata
  useEffect(() => {
    loadSpecialties();
    loadAvailableStates();
  }, []);

  useEffect(() => {
    if (selectedState) loadAvailableCities(selectedState);
    setSelectedCity("");
    setDoctors([]);
    setSelectedDoctor("");
  }, [selectedState]);

  useEffect(() => {
    if (selectedSpecialty && selectedState && selectedCity) {
      loadDoctors(selectedSpecialty, selectedState, selectedCity);
    } else {
      setDoctors([]);
    }
    setSelectedDoctor("");
  }, [selectedSpecialty, selectedState, selectedCity]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) loadAvailableTimeSlots(selectedDoctor, selectedDate);
    setSelectedTime("");
  }, [selectedDoctor, selectedDate]);

  // ===== FUNÇÃO CORRIGIDA =====
  const loadSpecialties = async () => {
    setIsLoadingSpecialties(true);
    try {
      // 1. A função do serviço busca os dados brutos (array de objetos)
      const rawData: SpecialtyInfo[] = await specialtyService.getAllSpecialties();
      
      if (!rawData || rawData.length === 0) {
        throw new Error("Nenhuma especialidade encontrada.");
      }
      
      // 2. Nós transformamos o array de objetos em um array de strings
      const specialtiesList = rawData.map(item => item.specialty);
      
      // 3. Salvamos o array de strings no estado
      setSpecialties(specialtiesList);

    } catch (error) {
      toast({ title: "Erro ao carregar especialidades", description: (error as Error).message, variant: "destructive" });
      setSpecialties([]);
    } finally {
      setIsLoadingSpecialties(false);
    }
  };
  
  const loadAvailableStates = async () => {
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase.rpc('get_available_states');
      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      toast({ title: "Erro ao carregar estados", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const loadAvailableCities = async (stateUf: string) => {
    setIsLoadingLocations(true);
    setCities([]);
    try {
      const { data, error } = await supabase.rpc('get_available_cities', { state_uf: stateUf });
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      toast({ title: "Erro ao carregar cidades", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingLocations(false);
    }
  };
  
  const loadDoctors = async (specialty: string, state: string, city: string) => {
    console.log(`🔍 Carregando médicos para ${specialty} em ${city}, ${state}`);
    setIsLoadingDoctors(true);
    setDoctors([]);
    try {
      let { data: doctorsData, error } = await supabase
        .from('medicos')
        .select(`id, user_id, especialidades, telefone, crm, profiles!medicos_user_id_fkey(display_name)`)
        .contains('especialidades', [specialty])
        .eq('endereco->>uf', state)
        .eq('endereco->>cidade', city);
      
      if (error) throw new Error(`Erro de rede: ${error.message}`);
      
      if (doctorsData && !Array.isArray(doctorsData)) doctorsData = [doctorsData];

      if (!doctorsData || doctorsData.length === 0) {
        toast({ title: "Nenhum resultado", description: `Não foram encontrados médicos para "${specialty}" em ${city}, ${state}.` });
        setDoctors([]);
      } else {
        console.log(`👨‍⚕️ Médicos encontrados: ${doctorsData.length}`, doctorsData);
        setDoctors(doctorsData as Doctor[]);
      }
    } catch (error) {
      toast({ title: "Erro ao carregar médicos", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const loadAvailableTimeSlots = async (doctorId: string, date: string) => { /* ...código original... */ };
  const handleAgendamento = async () => { /* ...código original... */ };
  const handleStateChange = (state: string) => setSelectedState(state);
  const handleCityChange = (city: string) => setSelectedCity(city);
  const handleSpecialtyChange = (specialty: string) => setSelectedSpecialty(specialty);
  const handleDoctorChange = (doctorId: string) => { /* ...código original... */ };
  const handleDateChange = (date: string) => { /* ...código original... */ };

  return {
    selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedDoctorName,
    specialties, states, cities,
    doctors: doctors.map(doctor => ({ id: doctor.user_id, display_name: doctor.profiles?.display_name || "Médico sem nome" })),
    availableTimeSlots,
    isLoadingSpecialties, isLoadingLocations, isLoadingDoctors, isLoadingTimeSlots, isSubmitting,
    handleSpecialtyChange, handleStateChange, handleCityChange, handleDoctorChange, handleDateChange, setSelectedTime, handleAgendamento,
  };
};
