import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { specialtyService } from "@/services/specialtyService";

// ... (interfaces Doctor, TimeSlot, StateInfo, CityInfo permanecem as mesmas) ...
interface Doctor {
  id: string; user_id: string; especialidades: string[]; telefone: string; crm: string;
  profiles: { display_name: string | null; } | null;
}
interface TimeSlot { time: string; available: boolean; }
interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }
interface SpecialtyInfo { specialty: string; }

export const useAppointmentScheduling = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados principais e de dados
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

  // ===== useEffect CORRIGIDO =====
  useEffect(() => {
    // Sempre que os filtros principais mudarem, limpe as seleções subsequentes
    setDoctors([]);
    setSelectedDoctor("");

    // E então, se todos os filtros estiverem preenchidos, busque os médicos
    if (selectedSpecialty && selectedState && selectedCity) {
      loadDoctors(selectedSpecialty, selectedState, selectedCity);
    }
  }, [selectedSpecialty, selectedState, selectedCity]);
  // ==============================

  useEffect(() => {
    if (selectedDoctor) { // Apenas executa se um médico for selecionado
        const doctor = doctors.find(d => d.user_id === selectedDoctor);
        if (doctor?.profiles?.display_name) {
          setSelectedDoctorName(doctor.profiles.display_name);
        }
        // A busca de horários agora deve ser chamada aqui também
        if (selectedDate) {
          loadAvailableTimeSlots(selectedDoctor, selectedDate);
        }
    } else {
        // Se nenhum médico estiver selecionado, limpe os dados dependentes
        setSelectedDoctorName("");
    }
    setAvailableTimeSlots([]); // Limpa os horários ao mudar de médico
    setSelectedTime("");      // Limpa a hora selecionada
  }, [selectedDoctor]);
  
  useEffect(() => {
    if(selectedDoctor && selectedDate) {
        loadAvailableTimeSlots(selectedDoctor, selectedDate);
    }
    setSelectedTime("");
  }, [selectedDate]);

  const loadSpecialties = async () => { /* ...código da versão anterior... */ };
  const loadAvailableStates = async () => { /* ...código da versão anterior... */ };
  const loadAvailableCities = async (stateUf: string) => { /* ...código da versão anterior... */ };
  const loadDoctors = async (specialty: string, state: string, city: string) => { /* ...código da versão anterior... */ };
  const loadAvailableTimeSlots = async (doctorId: string, date: string) => { /* ...código da versão anterior... */ };
  const handleAgendamento = async () => { /* ...código da versão anterior... */ };

  const handleStateChange = (state: string) => setSelectedState(state);
  const handleCityChange = (city: string) => setSelectedCity(city);
  const handleSpecialtyChange = (specialty: string) => setSelectedSpecialty(specialty);
  const handleDoctorChange = (doctorId: string) => setSelectedDoctor(doctorId);
  const handleDateChange = (date: string) => setSelectedDate(date);
  
  return {
    selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedDoctorName,
    specialties, states, cities,
    doctors: doctors.map(doctor => ({ id: doctor.user_id, display_name: doctor.profiles?.display_name || "Médico sem nome" })),
    availableTimeSlots,
    isLoadingSpecialties, isLoadingLocations, isLoadingDoctors, isLoadingTimeSlots, isSubmitting,
    handleSpecialtyChange, handleStateChange, handleCityChange, handleDoctorChange, handleDateChange, setSelectedTime, handleAgendamento,
  };
};
