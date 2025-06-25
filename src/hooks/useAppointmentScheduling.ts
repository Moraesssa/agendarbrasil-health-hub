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
    email: string;
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
  const [selectedState, setSelectedState] = useState<string>(""); // NOVO ESTADO
  const [selectedCity, setSelectedCity] = useState<string>(""); // NOVO ESTADO
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>("");

  // Dados para os seletores
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]); // NOVO ESTADO
  const [cities, setCities] = useState<CityInfo[]>([]); // NOVO ESTADO
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  // Estados de loading
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false); // NOVO ESTADO
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
    // Limpar seleções seguintes ao trocar de estado
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
    // Limpar seleções seguintes ao trocar de filtro
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
      if (specialtiesData.length === 0) throw new Error("Nenhuma especialidade encontrada.");
      setSpecialties(specialtiesData);
    } catch (error) {
      toast({ title: "Erro ao carregar especialidades", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingSpecialties(false);
    }
  };
  
  // NOVA FUNÇÃO para carregar estados disponíveis
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

  // NOVA FUNÇÃO para carregar cidades de um estado
  const loadAvailableCities = async (stateUf: string) => {
    setIsLoadingLocations(true);
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
  
  // FUNÇÃO MODIFICADA para incluir filtros de localização
  const loadDoctors = async (specialty: string, state: string, city: string) => {
    console.log(`🔍 Carregando médicos para ${specialty} em ${city}, ${state}`);
    setIsLoadingDoctors(true);
    setDoctors([]);
    try {
      let query = supabase
        .from('medicos')
        .select(`id, user_id, especialidades, telefone, crm, profiles!medicos_user_id_fkey(display_name, email)`)
        .contains('especialidades', [specialty])
        .eq('endereco->>uf', state)
        .eq('endereco->>cidade', city);

      const { data: doctorsData, error } = await query;
      
      if (error) throw new Error(`Erro ao carregar médicos: ${error.message}`);
      if (!doctorsData || doctorsData.length === 0) {
        throw new Error(`Nenhum médico encontrado para "${specialty}" em ${city}, ${state}.`);
      }
      setDoctors(doctorsData as Doctor[]);
    } catch (error) {
      toast({ title: "Erro ao carregar médicos", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const loadAvailableTimeSlots = async (doctorId: string, date: string) => {
    // (Esta função permanece a mesma, sem alterações)
    // ...
  };

  const handleAgendamento = async () => {
    // (Esta função permanece a mesma, sem alterações)
    // ...
  };

  // Handlers para os novos selects
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    // Demais resets já são feitos pelo useEffect
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    // Demais resets já são feitos pelo useEffect
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
    handleSpecialtyChange: setSelectedSpecialty,
    handleStateChange,
    handleCityChange,
    handleDoctorChange: setSelectedDoctor,
    handleDateChange: setSelectedDate,
    setSelectedTime,
    handleAgendamento,
  };
};
