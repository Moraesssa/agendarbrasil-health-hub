
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { appointmentService, LocalComHorarios, Medico } from "@/services/appointmentService";
import { logger } from "@/utils/logger";
import { getSupabaseConfig } from "@/utils/supabaseCheck";
import { 
  mockSpecialties, 
  mockStates, 
  mockCities, 
  mockDoctors, 
  mockLocaisComHorarios 
} from "@/utils/mockData";

interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useAppointmentScheduling = () => {
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

  const resetSelection = useCallback((level?: 'state' | 'city' | 'doctor' | 'date') => {
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
      
      const config = getSupabaseConfig();
      
      // Se Supabase não estiver configurado, usar dados mock
      if (!config.isConfigured) {
        console.log("🔧 Usando dados mock - Supabase não configurado");
        setSpecialties(mockSpecialties);
        setStates(mockStates);
        setIsLoading(false);
        return;
      }
      
      try {
        const [specialtiesData, statesData] = await Promise.all([
          appointmentService.getSpecialties(),
          supabase.rpc('get_available_states').then(res => res.data || [])
        ]);
        setSpecialties(Array.isArray(specialtiesData) ? specialtiesData : []);
        setStates(Array.isArray(statesData) ? statesData as StateInfo[] : []);
      } catch (e) {
        console.error("Erro ao carregar dados iniciais:", e);
        logger.error("Erro ao carregar dados iniciais", "useAppointmentScheduling", e);
        
        // Em caso de erro, usar dados mock como fallback
        console.log("🔧 Usando dados mock como fallback");
        setSpecialties(mockSpecialties);
        setStates(mockStates);
        
        toast({ 
          title: "Usando dados de demonstração", 
          description: "Conectividade com banco limitada. Dados de exemplo sendo exibidos.",
          variant: "default" 
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
      
      const config = getSupabaseConfig();
      
      // Se Supabase não estiver configurado, usar dados mock
      if (!config.isConfigured) {
        const mockCitiesForState = mockCities[selectedState as keyof typeof mockCities] || [];
        setCities(mockCitiesForState);
        setIsLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase.rpc('get_available_cities', { state_uf: selectedState });
        setCities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        // Fallback para dados mock
        const mockCitiesForState = mockCities[selectedState as keyof typeof mockCities] || [];
        setCities(mockCitiesForState);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCities();
  }, [selectedState]);

  useEffect(() => {
    if (!selectedSpecialty || !selectedCity || !selectedState) {
        setDoctors([]); // Limpa a lista se os filtros mudarem
        return;
    }
    
    const loadDoctors = async () => {
      setIsLoading(true);
      
      const config = getSupabaseConfig();
      
      // Se Supabase não estiver configurado, usar dados mock
      if (!config.isConfigured) {
        setDoctors(mockDoctors);
        setIsLoading(false);
        return;
      }
      
      try {
        const doctorsData = await appointmentService.getDoctorsByLocationAndSpecialty(selectedSpecialty, selectedCity, selectedState);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } catch (error) {
        console.error("Erro ao carregar médicos:", error);
        // Fallback para dados mock
        setDoctors(mockDoctors);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDoctors();
  }, [selectedSpecialty, selectedCity, selectedState]);
  
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
        setLocaisComHorarios([]); // Limpa se não houver médico ou data
        return;
    }
    
    const loadSlots = async () => {
      setIsLoading(true);
      
      const config = getSupabaseConfig();
      
      // Se Supabase não estiver configurado, usar dados mock
      if (!config.isConfigured) {
        console.log("🔧 Usando horários mock - Supabase não configurado");
        // Gerar horários mock com base na data selecionada
        const mockSlotsWithDate = mockLocaisComHorarios.map(local => ({
          ...local,
          horarios_disponiveis: local.horarios_disponiveis.map(slot => ({
            ...slot,
            available: Math.random() > 0.3 // 70% dos horários disponíveis
          }))
        }));
        setLocaisComHorarios(mockSlotsWithDate);
        setIsLoading(false);
        return;
      }
      
      try {
        const slots = await appointmentService.getAvailableSlotsByDoctor(selectedDoctor, selectedDate);
        setLocaisComHorarios(Array.isArray(slots) ? slots : []);
      } catch (error) {
        console.error("Erro ao carregar horários:", error);
        // Fallback para dados mock em caso de erro
        console.log("🔧 Usando horários mock como fallback");
        setLocaisComHorarios(mockLocaisComHorarios);
        
        toast({ 
          title: "Usando dados de demonstração", 
          description: "Problema ao carregar horários reais. Exibindo horários de exemplo.",
          variant: "default" 
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

      await appointmentService.scheduleAppointment({
        paciente_id: user.id,
        medico_id: selectedDoctor,
        data_consulta: appointmentDateTime,
        tipo_consulta: selectedSpecialty,
        local_id: selectedLocal.id,
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
