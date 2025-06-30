
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { appointmentService, LocalComHorarios, Medico } from "@/services/appointmentService";

interface StateInfo { uf: string; }
interface CityInfo { cidade: string; }

export const useAppointmentScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados do formulário
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedLocal, setSelectedLocal] = useState<LocalComHorarios | null>(null);

  // Listas de opções
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [locaisComHorarios, setLocaisComHorarios] = useState<LocalComHorarios[]>([]);

  // Estados de carregamento
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregamento inicial
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [specialtiesData, statesData] = await Promise.all([
          appointmentService.getSpecialties(),
          supabase.rpc('get_available_states').then(res => res.data || [])
        ]);
        setSpecialties(specialtiesData);
        setStates(statesData);
      } catch (e) {
        toast({ title: "Erro ao carregar dados iniciais", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [toast]);

  // Lógica de busca em cascata
  useEffect(() => {
    if (!selectedState) return;
    supabase.rpc('get_available_cities', { state_uf: selectedState }).then(({ data }) => setCities(data || []));
  }, [selectedState]);

  useEffect(() => {
    if (!selectedSpecialty || !selectedCity || !selectedState) return;
    appointmentService.getDoctorsByLocationAndSpecialty(selectedSpecialty, selectedCity, selectedState)
      .then(setDoctors);
  }, [selectedSpecialty, selectedCity, selectedState]);
  
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    appointmentService.getAvailableSlotsByDoctor(selectedDoctor, selectedDate)
      .then(setLocaisComHorarios);
  }, [selectedDoctor, selectedDate]);
  
  // Limpeza de seleções
  const resetSelection = (level: 'state' | 'city' | 'doctor' | 'date') => {
    if (level === 'state') { setSelectedCity(""); setDoctors([]); }
    if (level === 'city') { setDoctors([]); }
    if (level === 'doctor') { setSelectedDate(""); }
    if (level === 'date') { setSelectedTime(""); setSelectedLocal(null); setLocaisComHorarios([]); }
  }

  // Submissão
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
        local_consulta_texto: localTexto
      });

      toast({ title: "Consulta agendada com sucesso!", description: "Você será redirecionado para a sua agenda." });
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
