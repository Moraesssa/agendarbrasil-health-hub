import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { appointmentService, LocalComHorarios, Medico } from "@/services/appointmentService";
import { logger } from "@/utils/logger";

interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useAppointmentScheduling = () => {
  const { user, loading: authLoading } = useAuth();
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

  // Reseta as seleções em cascata
  const resetSelection = useCallback((level: 'state' | 'city' | 'doctor' | 'date') => {
    if (level === 'state') { setSelectedCity(""); setCities([]); }
    if (level === 'state' || level === 'city') { setSelectedDoctor(""); setDoctors([]); }
    if (level === 'state' || level === 'city' || level === 'doctor') { setSelectedDate(""); }
    if (level === 'state' || level === 'city' || level === 'doctor' || level === 'date') {
      setSelectedTime("");
      setSelectedLocal(null);
      setLocaisComHorarios([]);
    }
  }, []);

  // Efeito para carregar dados iniciais (especialidades e estados)
  useEffect(() => {
    // Só executa quando a autenticação terminar e tivermos um usuário
    if (authLoading || !user) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [specialtiesData, statesData] = await Promise.all([
          appointmentService.getSpecialties(),
          supabase.rpc('get_available_states').then(res => res.data || [])
        ]);
        setSpecialties(specialtiesData);
        setStates(statesData as StateInfo[]);
      } catch (e) {
        logger.error("Erro ao carregar dados iniciais", "useAppointmentScheduling", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [authLoading, user]); // Depende do status de autenticação e do usuário

  // Efeitos em cascata
  useEffect(() => {
    if (!selectedState) return;
    appointmentService.getAvailableCities(selectedState).then(setCities);
  }, [selectedState]);

  useEffect(() => {
    if (!selectedSpecialty || !selectedCity || !selectedState) return;
    appointmentService.getDoctorsByLocationAndSpecialty(selectedSpecialty, selectedCity, selectedState).then(setDoctors);
  }, [selectedSpecialty, selectedCity, selectedState]);
  
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    appointmentService.getAvailableSlotsByDoctor(selectedDoctor, selectedDate).then(setLocaisComHorarios);
  }, [selectedDoctor, selectedDate]);

  const handleAgendamento = useCallback(async () => {
    if (!user || !isFormComplete()) return;
    setIsSubmitting(true);
    // ... (lógica de agendamento)
  }, [user, navigate, toast, selectedDoctor, selectedDate, selectedTime, selectedLocal, selectedSpecialty]);

  const isFormComplete = () => {
    return !!(selectedSpecialty && selectedState && selectedCity && selectedDoctor && selectedDate && selectedTime && selectedLocal);
  };

  return {
    models: { selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedLocal, specialties, states, cities, doctors, locaisComHorarios },
    setters: { setSelectedSpecialty, setSelectedState, setSelectedCity, setSelectedDoctor, setSelectedDate, setSelectedTime, setSelectedLocal },
    state: { isLoading: isLoading || authLoading, isSubmitting },
    actions: { handleAgendamento, resetSelection, isFormComplete }
  };
};
