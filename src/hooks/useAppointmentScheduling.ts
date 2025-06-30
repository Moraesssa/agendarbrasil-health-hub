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
  const { user, loading: authLoading } = useAuth(); // <-- Pega o estado de loading da autenticação
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

  const [isLoading, setIsLoading] = useState(true); // <-- Inicia como true
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetSelection = useCallback((level: 'state' | 'city' | 'doctor' | 'date') => {
    if (level === 'state') setSelectedCity("");
    if (level === 'state' || level === 'city') setDoctors([]);
    if (level === 'state' || level === 'city' || level === 'doctor') setSelectedDate("");
    if (level === 'state' || level === 'city' || level === 'doctor' || level === 'date') {
      setSelectedTime("");
      setSelectedLocal(null);
      setLocaisComHorarios([]);
    }
  }, []);

  // Busca inicial de dados - AGORA DEPENDE DE `authLoading`
  useEffect(() => {
    if (authLoading || !user) return; // <-- Espera a autenticação terminar E o usuário existir

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
        toast({ title: "Erro ao carregar dados", description: "Não foi possível buscar especialidades e estados.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [toast, user, authLoading]); // <-- Adicionada a dependência `authLoading`

  // Efeitos em cascata
  useEffect(() => {
    if (!selectedState) { setCities([]); return; }
    appointmentService.getAvailableCities(selectedState).then(setCities);
  }, [selectedState]);

  useEffect(() => {
    if (!selectedSpecialty || !selectedCity || !selectedState) { setDoctors([]); return; }
    appointmentService.getDoctorsByLocationAndSpecialty(selectedSpecialty, selectedCity, selectedState).then(setDoctors);
  }, [selectedSpecialty, selectedCity, selectedState]);
  
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) { setLocaisComHorarios([]); return; }
    appointmentService.getAvailableSlotsByDoctor(selectedDoctor, selectedDate).then(setLocaisComHorarios);
  }, [selectedDoctor, selectedDate]);

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
        local_consulta: localTexto,
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
    state: { isLoading: isLoading || authLoading, isSubmitting }, // <-- Combina os loadings
    actions: { handleAgendamento, resetSelection }
  };
};
