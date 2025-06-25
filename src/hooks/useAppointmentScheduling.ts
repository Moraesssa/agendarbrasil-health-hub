
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Doctor {
  id: string;
  user_id: string;
  especialidades: string[];
  telefone: string;
  crm: string;
  profiles: {
    display_name: string | null;
    email: string;
  } | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export const useAppointmentScheduling = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados principais
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>("");

  // Dados
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  // Estados de loading
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de erro
  const [isErrorSpecialties, setIsErrorSpecialties] = useState(false);
  const [isErrorDoctors, setIsErrorDoctors] = useState(false);
  const [isErrorTimeSlots, setIsErrorTimeSlots] = useState(false);
  const [errorSpecialties, setErrorSpecialties] = useState<Error | null>(null);
  const [errorDoctors, setErrorDoctors] = useState<Error | null>(null);
  const [errorTimeSlots, setErrorTimeSlots] = useState<Error | null>(null);

  // Carregar especialidades ao montar o componente
  useEffect(() => {
    loadSpecialties();
  }, []);

  // Carregar médicos quando especialidade é selecionada
  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctors(selectedSpecialty);
    } else {
      setDoctors([]);
      setSelectedDoctor("");
      setSelectedDoctorName("");
    }
  }, [selectedSpecialty]);

  // Carregar horários quando médico e data são selecionados
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableTimeSlots(selectedDoctor, selectedDate);
    } else {
      setAvailableTimeSlots([]);
      setSelectedTime("");
    }
  }, [selectedDoctor, selectedDate]);

  const loadSpecialties = async () => {
    console.log("🔍 Carregando especialidades...");
    setIsLoadingSpecialties(true);
    setIsErrorSpecialties(false);
    setErrorSpecialties(null);

    try {
      // Primeiro, vamos verificar se há médicos cadastrados
      const { data: medicosData, error: medicosError } = await supabase
        .from('medicos')
        .select('especialidades')
        .not('especialidades', 'is', null);

      if (medicosError) {
        console.error("❌ Erro ao buscar médicos:", medicosError);
        throw new Error(`Erro ao carregar médicos: ${medicosError.message}`);
      }

      console.log("👨‍⚕️ Médicos encontrados:", medicosData);

      if (!medicosData || medicosData.length === 0) {
        throw new Error("Nenhum médico cadastrado no sistema. Verifique se há médicos com especialidades definidas.");
      }

      // Extrair especialidades únicas
      const allSpecialties: string[] = [];
      medicosData.forEach(medico => {
        if (medico.especialidades && Array.isArray(medico.especialidades)) {
          allSpecialties.push(...medico.especialidades);
        }
      });

      const uniqueSpecialties = [...new Set(allSpecialties)].filter(Boolean);
      console.log("🏥 Especialidades encontradas:", uniqueSpecialties);

      if (uniqueSpecialties.length === 0) {
        throw new Error("Nenhuma especialidade encontrada. Verifique se os médicos têm especialidades cadastradas.");
      }

      setSpecialties(uniqueSpecialties);

    } catch (error) {
      console.error("❌ Erro completo:", error);
      setIsErrorSpecialties(true);
      setErrorSpecialties(error as Error);
      setSpecialties([]);
      toast({
        title: "Erro ao carregar especialidades",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSpecialties(false);
    }
  };

  const loadDoctors = async (specialty: string) => {
    console.log("🔍 Carregando médicos para especialidade:", specialty);
    setIsLoadingDoctors(true);
    setIsErrorDoctors(false);
    setErrorDoctors(null);

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
            display_name,
            email
          )
        `)
        .contains('especialidades', [specialty]);

      if (error) {
        console.error("❌ Erro ao buscar médicos:", error);
        throw new Error(`Erro ao carregar médicos: ${error.message}`);
      }

      console.log("👨‍⚕️ Médicos da especialidade:", doctorsData);

      if (!doctorsData || doctorsData.length === 0) {
        throw new Error(`Nenhum médico encontrado para a especialidade "${specialty}".`);
      }

      setDoctors(doctorsData as Doctor[]);
      
    } catch (error) {
      console.error("❌ Erro ao carregar médicos:", error);
      setIsErrorDoctors(true);
      setErrorDoctors(error as Error);
      setDoctors([]);
      toast({
        title: "Erro ao carregar médicos",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const loadAvailableTimeSlots = async (doctorId: string, date: string) => {
    console.log("🔍 Carregando horários para médico:", doctorId, "data:", date);
    setIsLoadingTimeSlots(true);
    setIsErrorTimeSlots(false);
    setErrorTimeSlots(null);

    try {
      // Buscar consultas já agendadas para esse médico nessa data
      const { data: existingAppointments, error: appointmentError } = await supabase
        .from('consultas')
        .select('data_consulta')
        .eq('medico_id', doctorId)
        .gte('data_consulta', `${date}T00:00:00`)
        .lte('data_consulta', `${date}T23:59:59`)
        .in('status', ['agendada', 'confirmada']);

      if (appointmentError) {
        console.error("❌ Erro ao buscar consultas existentes:", appointmentError);
        throw new Error(`Erro ao verificar horários ocupados: ${appointmentError.message}`);
      }

      console.log("📅 Consultas existentes:", existingAppointments);

      // Buscar configurações do médico
      const { data: doctorConfig, error: configError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('id', doctorId)
        .single();

      if (configError) {
        console.error("❌ Erro ao buscar configurações do médico:", configError);
        // Se não encontrar configurações, usar padrão
      }

      console.log("⚙️ Configurações do médico:", doctorConfig);

      // Gerar horários padrão (das 8h às 18h, de hora em hora)
      const defaultTimeSlots = [
        "08:00", "09:00", "10:00", "11:00", "12:00", 
        "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
      ];

      // Verificar se é um dia da semana válido (segunda a sexta)
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Fins de semana - horários reduzidos
        const weekendSlots = ["08:00", "09:00", "10:00", "11:00", "12:00"];
        const availableSlots = weekendSlots.map(time => ({
          time,
          available: !existingAppointments?.some(apt => 
            new Date(apt.data_consulta).toTimeString().startsWith(time)
          )
        }));
        setAvailableTimeSlots(availableSlots);
        return;
      }

      // Usar horários das configurações do médico se disponível
      let timeSlots = defaultTimeSlots;
      if (doctorConfig?.configuracoes) {
        const config = doctorConfig.configuracoes as any;
        if (config.horarios) {
          timeSlots = config.horarios;
        }
      }

      // Marcar horários como disponíveis ou ocupados
      const availableSlots: TimeSlot[] = timeSlots.map(time => ({
        time,
        available: !existingAppointments?.some(apt => 
          new Date(apt.data_consulta).toTimeString().startsWith(time)
        )
      }));

      console.log("⏰ Horários processados:", availableSlots);
      setAvailableTimeSlots(availableSlots);

    } catch (error) {
      console.error("❌ Erro ao carregar horários:", error);
      setIsErrorTimeSlots(true);
      setErrorTimeSlots(error as Error);
      setAvailableTimeSlots([]);
      toast({
        title: "Erro ao carregar horários",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  const handleSpecialtyChange = (specialty: string) => {
    console.log("🏥 Especialidade selecionada:", specialty);
    setSelectedSpecialty(specialty);
    setSelectedDoctor("");
    setSelectedDoctorName("");
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleDoctorChange = (doctorId: string) => {
    console.log("👨‍⚕️ Médico selecionado:", doctorId);
    setSelectedDoctor(doctorId);
    
    // Encontrar o nome do médico
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor?.profiles?.display_name) {
      setSelectedDoctorName(doctor.profiles.display_name);
    }
    
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleDateChange = (date: string) => {
    console.log("📅 Data selecionada:", date);
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleAgendamento = async () => {
    if (!user || !userData) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para agendar uma consulta.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos antes de agendar.",
        variant: "destructive",
      });
      return;
    }

    console.log("📝 Iniciando agendamento:", {
      specialty: selectedSpecialty,
      doctor: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
      patient: user.id
    });

    setIsSubmitting(true);

    try {
      // Verificar se o paciente existe na tabela pacientes
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError && patientError.code !== 'PGRST116') {
        throw new Error(`Erro ao verificar dados do paciente: ${patientError.message}`);
      }

      let patientId = patientData?.id;

      // Se o paciente não existe, criar registro
      if (!patientData) {
        console.log("👤 Criando registro de paciente...");
        const { data: newPatient, error: createPatientError } = await supabase
          .from('pacientes')
          .insert({
            user_id: user.id,
            dados_pessoais: {
              nome: userData.displayName || user.email,
              email: user.email
            },
            contato: {
              email: user.email
            }
          })
          .select('id')
          .single();

        if (createPatientError) {
          throw new Error(`Erro ao criar registro do paciente: ${createPatientError.message}`);
        }

        patientId = newPatient.id;
      }

      // Criar a consulta
      const appointmentDateTime = `${selectedDate}T${selectedTime}:00`;
      
      const { data: appointment, error: appointmentError } = await supabase
        .from('consultas')
        .insert({
          paciente_id: patientId,
          medico_id: selectedDoctor,
          data_consulta: appointmentDateTime,
          tipo_consulta: selectedSpecialty,
          status: 'agendada' as const,
          duracao_minutos: 60,
          motivo: `Consulta de ${selectedSpecialty}`
        })
        .select()
        .single();

      if (appointmentError) {
        throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`);
      }

      console.log("✅ Consulta agendada com sucesso:", appointment);

      toast({
        title: "Consulta agendada com sucesso!",
        description: `Sua consulta de ${selectedSpecialty} foi agendada para ${new Date(appointmentDateTime).toLocaleString('pt-BR')}.`,
      });

      // Resetar formulário
      setSelectedSpecialty("");
      setSelectedDoctor("");
      setSelectedDoctorName("");
      setSelectedDate("");
      setSelectedTime("");

      // Navegar para a agenda do paciente
      setTimeout(() => {
        navigate("/agenda-paciente");
      }, 2000);

    } catch (error) {
      console.error("❌ Erro no agendamento:", error);
      toast({
        title: "Erro ao agendar consulta",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Estado
    selectedSpecialty,
    selectedDoctor,
    selectedDate,
    selectedTime,
    selectedDoctorName,
    
    // Dados
    specialties,
    doctors,
    availableTimeSlots,
    
    // Estados de loading
    isLoadingSpecialties,
    isLoadingDoctors,
    isLoadingTimeSlots,
    isSubmitting,
    
    // Estados de erro
    isErrorSpecialties,
    isErrorDoctors,
    isErrorTimeSlots,
    errorSpecialties,
    errorDoctors,
    errorTimeSlots,
    
    // Handlers
    handleSpecialtyChange,
    handleDoctorChange,
    handleDateChange,
    setSelectedTime,
    handleAgendamento,
  };
};
