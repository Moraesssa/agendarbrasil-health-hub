import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { specialtyService } from "@/services/specialtyService";

// Tipagem para os dados que esperamos da tabela 'medicos'
interface Doctor {
  id: string;
  user_id: string;
  especialidades: string[];
  telefone: string;
  crm: string;
  // Assumimos que a busca no perfil via chave estrangeira retorna este objeto
  profiles: {
    display_name: string | null;
  } | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

// Interfaces para os novos dados de localização
interface StateInfo {
  uf: string;
}

interface CityInfo {
  cidade: string;
}

export const useAppointmentScheduling = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados principais
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>("");

  // Dados para os seletores
  const [specialties, setSpecialties] = useState<string[]>([]);
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

  // Carregar especialidades e estados ao montar
  useEffect(() => {
    loadSpecialties();
    loadAvailableStates();
  }, []);

  // Carregar cidades quando um estado é selecionado
  useEffect(() => {
    if (selectedState) {
      loadAvailableCities(selectedState);
    }
    setSelectedCity("");
    setDoctors([]);
    setSelectedDoctor("");
  }, [selectedState]);

  // Carregar médicos apenas quando os filtros essenciais estiverem preenchidos
  useEffect(() => {
    if (selectedSpecialty && selectedState && selectedCity) {
      loadDoctors(selectedSpecialty, selectedState, selectedCity);
    } else {
      setDoctors([]);
    }
    setSelectedDoctor("");
  }, [selectedSpecialty, selectedState, selectedCity]);

  // Carregar horários quando médico e data são selecionados
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableTimeSlots(selectedDoctor, selectedDate);
    }
    setSelectedTime("");
  }, [selectedDoctor, selectedDate]);

  const loadSpecialties = async () => {
    setIsLoadingSpecialties(true);
    try {
      const specialtiesData = await specialtyService.getAllSpecialties();
      if (!specialtiesData || specialtiesData.length === 0) throw new Error("Nenhuma especialidade encontrada.");
      setSpecialties(specialtiesData);
    } catch (error) {
      toast({ title: "Erro ao carregar especialidades", description: (error as Error).message, variant: "destructive" });
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
      const { data: doctorsData, error } = await supabase
        .from('medicos')
        .select(`
          id,
          user_id,
          especialidades,
          telefone,
          crm,
          profiles!medicos_user_id_fkey (
            display_name
          )
        `) // ===== CORREÇÃO AQUI: removido o campo 'email' =====
        .contains('especialidades', [specialty])
        .eq('endereco->>uf', state)
        .eq('endereco->>cidade', city);
      
      if (error) {
        throw new Error(`Erro de rede ou permissão: ${error.message}`);
      }

      if (!doctorsData || doctorsData.length === 0) {
        // Isso agora é tratado com uma mensagem amigável, não um erro
        toast({
          title: "Nenhum resultado",
          description: `Não foram encontrados médicos para "${specialty}" em ${city}, ${state}.`,
          variant: "default",
        });
        setDoctors([]); // Garante que a lista está vazia
      } else {
        console.log("👨‍⚕️ Médicos da especialidade:", doctorsData);
        setDoctors(doctorsData as Doctor[]);
      }

    } catch (error) {
      toast({ title: "Erro ao carregar médicos", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const loadAvailableTimeSlots = async (doctorId: string, date: string) => {
    // ...código sem alteração...
  };

  const handleAgendamento = async () => {
    // ...código sem alteração...
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    const doctor = doctors.find(d => d.user_id === doctorId);
    if (doctor?.profiles?.display_name) {
      setSelectedDoctorName(doctor.profiles.display_name);
    }
    setSelectedDate("");
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };
  
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
  };

  return {
    // Estados selecionados
    selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedDoctorName,
    
    // Dados para os seletores
    specialties, states, cities,
    doctors: doctors.map(doctor => ({ id: doctor.user_id, display_name: doctor.profiles?.display_name || "Médico sem nome" })),
    availableTimeSlots,
    
    // Estados de loading
    isLoadingSpecialties, isLoadingLocations, isLoadingDoctors, isLoadingTimeSlots, isSubmitting,
    
    // Handlers
    handleSpecialtyChange,
    handleStateChange,
    handleCityChange,
    handleDoctorChange,
    handleDateChange,
    setSelectedTime,
    handleAgendamento,
  };
};

