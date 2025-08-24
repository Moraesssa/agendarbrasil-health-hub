
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAppointmentServiceInstance } from '@/contexts/AppointmentServiceProvider';
import { LocalComHorarios } from "@/services/mockDataService";
import { Medico } from "@/services/newAppointmentService";
import { logger } from "@/utils/logger";
import { getSupabaseConfig } from "@/utils/supabaseCheck";

interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useAppointmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const appointmentService = useAppointmentServiceInstance();

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
    const loadInitialData = async () => {
      setIsLoading(true);
      
      const config = getSupabaseConfig();
      
      // Verificar se Supabase está configurado - OBRIGATÓRIO para produção
      if (!config.isConfigured) {
        const errorMsg = "Configuração do Supabase não encontrada. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";
        logger.error(errorMsg, "useAppointmentScheduling");
        toast({ 
          title: "Erro de Configuração", 
          description: "Sistema não configurado corretamente. Entre em contato com o suporte.",
          variant: "destructive" 
        });
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
        
        toast({ 
          title: "Erro ao Carregar Dados", 
          description: "Não foi possível carregar as informações. Tente novamente em alguns instantes.",
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
        const { data } = await supabase.rpc('get_available_cities', { state_uf: selectedState });
        setCities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        logger.error("Erro ao carregar cidades", "useAppointmentScheduling", error);
        setCities([]);
        toast({ 
          title: "Erro ao Carregar Cidades", 
          description: "Não foi possível carregar as cidades disponíveis. Tente novamente.",
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
        console.log('🔄 [useAppointmentScheduling] Limpando médicos - filtros incompletos:', { selectedSpecialty, selectedCity, selectedState });
        setDoctors([]);
        return;
    }
    
    const loadDoctors = async () => {
      console.log('🚀 [useAppointmentScheduling] Iniciando busca de médicos:', { selectedSpecialty, selectedCity, selectedState });
      setIsLoading(true);
      
      try {
        const doctorsData = await appointmentService.getDoctorsByLocationAndSpecialty(selectedSpecialty, selectedCity, selectedState);
        console.log('📊 [useAppointmentScheduling] Médicos recebidos:', doctorsData);
        
        const validDoctors = Array.isArray(doctorsData) ? doctorsData : [];
        setDoctors(validDoctors);
        
        if (validDoctors.length === 0) {
          console.warn('⚠️ [useAppointmentScheduling] Nenhum médico encontrado para os filtros selecionados');
          toast({
            title: "Nenhum médico encontrado",
            description: `Não há médicos de ${selectedSpecialty} disponíveis em ${selectedCity}/${selectedState}.`,
            variant: "default"
          });
        } else {
          console.log(`✅ [useAppointmentScheduling] ${validDoctors.length} médico(s) encontrado(s)`);
        }
      } catch (error) {
        console.error("❌ [useAppointmentScheduling] Erro ao carregar médicos:", error);
        logger.error("Erro ao carregar médicos", "useAppointmentScheduling", error);
        setDoctors([]);
        toast({ 
          title: "Erro ao Carregar Médicos", 
          description: "Não foi possível carregar os médicos disponíveis. Verifique os filtros selecionados.",
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
        setLocaisComHorarios([]); // Limpa se não houver médico ou data
        return;
    }
    
    const loadSlots = async () => {
      setIsLoading(true);
      
      try {
        const slots = await appointmentService.getAvailableSlotsByDoctor(selectedDoctor, selectedDate);
        setLocaisComHorarios(Array.isArray(slots) ? slots : []);
      } catch (error) {
        console.error("Erro ao carregar horários:", error);
        logger.error("Erro ao carregar horários", "useAppointmentScheduling", error);
        setLocaisComHorarios([]);
        
        toast({ 
          title: "Erro ao Carregar Horários", 
          description: "Não foi possível carregar os horários disponíveis. Tente selecionar outro médico ou data.",
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSlots();
  }, [selectedDoctor, selectedDate, toast]);

  const handleAgendamento = useCallback(async () => {
    // Validar UUIDs antes de prosseguir
    if (!user?.id || user.id === 'undefined') {
      toast({ title: "Erro", description: "Usuário não identificado", variant: "destructive" });
      return;
    }
    
    if (!selectedDoctor || selectedDoctor === 'undefined') {
      toast({ title: "Erro", description: "Médico não selecionado", variant: "destructive" });
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      toast({ title: "Erro", description: "Data e horário devem ser selecionados", variant: "destructive" });
      return;
    }
    
    if (!selectedLocal?.id || selectedLocal.id === 'undefined') {
      toast({ title: "Erro", description: "Local não selecionado", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const localTexto = `${selectedLocal.nome_local} - ${selectedLocal.endereco.logradouro}, ${selectedLocal.endereco.numero || ''}`;

      console.log('🔍 [handleAgendamento] Dados do agendamento:', {
        paciente_id: user.id,
        medico_id: selectedDoctor,
        consultation_date: appointmentDateTime,
        consultation_type: selectedSpecialty,
        local_consulta_texto: localTexto
      });

      await appointmentService.scheduleAppointment({
        paciente_id: user.id,
        medico_id: selectedDoctor,
        consultation_date: appointmentDateTime,
        consultation_type: selectedSpecialty || 'Consulta Médica',
        local_consulta_texto: localTexto,
        local_id: selectedLocal.id
      });

      toast({ title: "Consulta agendada com sucesso!" });
      navigate("/agenda-paciente");
    } catch (error) {
      console.error('❌ [handleAgendamento] Erro:', error);
      toast({ 
        title: "Erro ao agendar", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
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
