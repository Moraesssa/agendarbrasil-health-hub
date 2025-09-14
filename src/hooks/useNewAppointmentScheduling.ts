
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import schedulingService, { LocalComHorarios, Medico } from "@/services/scheduling";
import { logger } from "@/utils/logger";
import { safeArrayAccess, isValidArray } from "@/utils/arrayUtils";

interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

// Interface for granular loading states
interface LoadingStates {
  specialties: boolean;
  states: boolean;
  cities: boolean;
  doctors: boolean;
  timeSlots: boolean;
}

// Constants for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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
  
  // Granular loading states for each data type
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    specialties: false,
    states: false,
    cities: false,
    doctors: false,
    timeSlots: false
  });

  // Helper functions to manage granular loading states
  const setLoadingState = useCallback((key: keyof LoadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);
  
  // Retry counters for each data type
  const [retryCounters, setRetryCounters] = useState({
    specialties: 0,
    states: 0,
    cities: 0,
    doctors: 0,
    timeSlots: 0
  });

  // Safe setter functions for each data type
  const safeSetSpecialties = useCallback((data: string[] | undefined | null) => {
    const safeData = safeArrayAccess(data);
  logger.debug('Safe setting specialties', 'useNewAppointmentScheduling', { count: safeData.length });
    setSpecialties(safeData);
  }, []);

  const safeSetStates = useCallback((data: StateInfo[] | undefined | null) => {
    const safeData = safeArrayAccess(data);
  logger.debug('Safe setting states', 'useNewAppointmentScheduling', { count: safeData.length });
    setStates(safeData);
  }, []);

  const safeSetCities = useCallback((data: CityInfo[] | undefined | null) => {
    const safeData = safeArrayAccess(data);
  logger.debug('Safe setting cities', 'useNewAppointmentScheduling', { count: safeData.length });
    setCities(safeData);
  }, []);

  const safeSetDoctors = useCallback((data: Medico[] | undefined | null) => {
    const safeData = safeArrayAccess(data);
  logger.debug('Safe setting doctors', 'useNewAppointmentScheduling', { count: safeData.length });
    setDoctors(safeData);
  }, []);

  const safeSetLocaisComHorarios = useCallback((data: LocalComHorarios[] | undefined | null) => {
    const safeData = safeArrayAccess(data);
  logger.debug('Safe setting locais com horarios', 'useNewAppointmentScheduling', { count: safeData.length });
    setLocaisComHorarios(safeData);
  }, []);

  // Retry logic helper
  const handleRetry = useCallback((dataType: keyof typeof retryCounters, retryFunction: () => Promise<void>) => {
    const currentCount = retryCounters[dataType];
    if (currentCount < MAX_RETRIES) {
      setRetryCounters(prev => ({ ...prev, [dataType]: prev[dataType] + 1 }));
      setTimeout(() => {
  logger.debug('Retrying data fetch', 'useNewAppointmentScheduling', { dataType, attempt: currentCount + 1, max: MAX_RETRIES });
        retryFunction();
      }, RETRY_DELAY * (currentCount + 1)); // Exponential backoff
    } else {
  logger.error('Max retries reached', 'useNewAppointmentScheduling', { dataType });
    }
  }, [retryCounters]);

  const resetSelection = useCallback((level: 'state' | 'city' | 'doctor' | 'date') => {
    if (level === 'state') {
      setSelectedCity("");
      safeSetDoctors([]);
      setSelectedDoctor("");
    }
    if (level === 'city') {
      safeSetDoctors([]);
      setSelectedDoctor("");
    }
    if (level === 'doctor') {
      setSelectedDate("");
    }
    if (level === 'date') {
      setSelectedTime("");
      setSelectedLocal(null);
      safeSetLocaisComHorarios([]);
    }
  }, [safeSetDoctors, safeSetLocaisComHorarios]);

  useEffect(() => {
    if (!user) return;
    
    const loadInitialData = async () => {
      setIsLoading(true);
      setLoadingState('specialties', true);
      setLoadingState('states', true);
      
      try {
        // Load specialties with defensive checks
        const specialtiesData = await schedulingService.getSpecialties();
  logger.info('Especialidades carregadas', 'useNewAppointmentScheduling', { count: specialtiesData?.length || 0 });
  safeSetSpecialties(specialtiesData);
        setLoadingState('specialties', false);
        
        // Load states with defensive checks
        const statesResponse = await supabase.rpc('get_available_states');
        const statesData = statesResponse.data;
  logger.info('Estados carregados', 'useNewAppointmentScheduling', { count: statesData?.length || 0 });
  safeSetStates(statesData as StateInfo[]);
        setLoadingState('states', false);
        
        // Reset retry counter on success
        setRetryCounters(prev => ({ ...prev, specialties: 0, states: 0 }));
        
        if (!isValidArray(statesData)) {
          toast({
            title: "Atenção",
            description: "Nenhum estado com médicos disponíveis foi encontrado.",
            variant: "default"
          });
        }
      } catch (e) {
  logger.error('Erro ao carregar dados iniciais', 'useNewAppointmentScheduling', e);
        
        // Reset loading states on error
        setLoadingState('specialties', false);
        setLoadingState('states', false);
        
        // Attempt retry for initial data
        handleRetry('specialties', loadInitialData);
        
        toast({ 
          title: "Erro ao carregar dados iniciais", 
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Reset retry counters when user changes
    setRetryCounters(prev => ({ ...prev, specialties: 0, states: 0 }));
    loadInitialData();
  }, [toast, user, safeSetSpecialties, safeSetStates, handleRetry, setLoadingState]);

  useEffect(() => {
    if (!selectedState) {
      safeSetCities([]);
      return;
    }
    
    const loadCities = async () => {
      setIsLoading(true);
      setLoadingState('cities', true);
      
      try {
        const { data, error } = await supabase.rpc('get_available_cities', { state_uf: selectedState });
        if (error) throw error;
  logger.info('Cidades carregadas', 'useNewAppointmentScheduling', { state: selectedState, count: data?.length || 0 });
  safeSetCities(data);
        
        // Reset retry counter on success
        setRetryCounters(prev => ({ ...prev, cities: 0 }));
      } catch (e) {
  logger.error('Erro ao carregar cidades', 'useNewAppointmentScheduling', e);
        
        // Attempt retry for cities
        handleRetry('cities', loadCities);
        
        toast({
          title: "Erro ao carregar cidades",
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setLoadingState('cities', false);
        setIsLoading(false);
      }
    };
    
    // Reset retry counter when state changes
    setRetryCounters(prev => ({ ...prev, cities: 0 }));
    loadCities();
  }, [selectedState, toast, safeSetCities, handleRetry, setLoadingState]);

  useEffect(() => {
    if (!selectedSpecialty || !selectedCity || !selectedState) {
      safeSetDoctors([]);
      return;
    }
    
    const loadDoctors = async () => {
      setIsLoading(true);
      setLoadingState('doctors', true);
      
      try {
        const doctorsData = await schedulingService.searchDoctors(
          selectedSpecialty,
          selectedState,
          selectedCity
        );
  logger.info('Médicos encontrados', 'useNewAppointmentScheduling', { count: doctorsData?.length || 0 });
  safeSetDoctors(doctorsData);
        
        // Reset retry counter on success
        setRetryCounters(prev => ({ ...prev, doctors: 0 }));
        
        if (!isValidArray(doctorsData)) {
          toast({
            title: "Nenhum médico encontrado",
            description: `Não há médicos de ${selectedSpecialty} em ${selectedCity}/${selectedState}`,
            variant: "default"
          });
        }
      } catch (e) {
  logger.error('Erro ao carregar médicos', 'useNewAppointmentScheduling', e);
        
        // Attempt retry for doctors
        handleRetry('doctors', loadDoctors);
        
        toast({
          title: "Erro ao carregar médicos",
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setLoadingState('doctors', false);
        setIsLoading(false);
      }
    };
    
    // Reset retry counter when dependencies change
    setRetryCounters(prev => ({ ...prev, doctors: 0 }));
    loadDoctors();
  }, [selectedSpecialty, selectedCity, selectedState, toast, safeSetDoctors, handleRetry, setLoadingState]);
  
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      safeSetLocaisComHorarios([]);
      return;
    }
    
    const loadSlots = async () => {
      setIsLoading(true);
      setLoadingState('timeSlots', true);
      
      try {
        const slots = await schedulingService.getAvailableSlots(selectedDoctor, selectedDate);
  logger.info('Slots encontrados', 'useNewAppointmentScheduling', { count: slots?.length || 0 });
  safeSetLocaisComHorarios(slots);
        
        // Reset retry counter on success
        setRetryCounters(prev => ({ ...prev, timeSlots: 0 }));
        
        if (!isValidArray(slots)) {
          toast({
            title: "Nenhum horário disponível",
            description: `Não há horários disponíveis para a data ${selectedDate}`,
            variant: "default"
          });
        }
      } catch (e) {
  logger.error('Erro ao carregar horários', 'useNewAppointmentScheduling', e);
        
        // Attempt retry for time slots
        handleRetry('timeSlots', loadSlots);
        
        toast({
          title: "Erro ao carregar horários",
          description: e instanceof Error ? e.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setLoadingState('timeSlots', false);
        setIsLoading(false);
      }
    };
    
    // Reset retry counter when dependencies change
    setRetryCounters(prev => ({ ...prev, timeSlots: 0 }));
    loadSlots();
  }, [selectedDoctor, selectedDate, toast, safeSetLocaisComHorarios, handleRetry, setLoadingState]);

  const handleAgendamento = useCallback(async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !selectedLocal) return;
    setIsSubmitting(true);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const localTexto = `${selectedLocal.nome_local} - ${selectedLocal.endereco.logradouro}, ${selectedLocal.endereco.numero}`;

      await schedulingService.createAppointment({
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
    state: { isLoading, isSubmitting, loadingStates, isAnyLoading: isAnyLoading() },
    actions: { handleAgendamento, resetSelection }
  };
};
