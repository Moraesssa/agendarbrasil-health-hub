
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateTimeSlots, getDefaultWorkingHours, type TimeSlot, type DoctorConfig } from "@/utils/timeSlotUtils";

// Tipagem para os médicos que virão do banco
interface Medico {
  id: string;
  display_name: string;
}

const Agendamento = () => {
  const { user } = useAuth(); // Hook para pegar o usuário logado
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados do componente
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(""); // Agora vai armazenar o ID do médico
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [specialties, setSpecialties] = useState<string[]>([]); // Lista de especialidades agora é dinâmica
  const [doctors, setDoctors] = useState<Medico[]>([]); // Lista de médicos buscada do DB
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  // Efeito para buscar todas as especialidades disponíveis na plataforma
  useEffect(() => {
    const fetchSpecialties = async () => {
      setIsLoadingSpecialties(true);
      try {
        const { data, error } = await supabase
          .from('medicos')
          .select('especialidades');

        if (error) throw error;

        // Processa para criar uma lista única de especialidades
        const allSpecialties = data.flatMap(medico => medico.especialidades);
        const uniqueSpecialties = [...new Set(allSpecialties)].sort(); // Remove duplicatas e ordena
        setSpecialties(uniqueSpecialties);
        
      } catch (error) {
        console.error("Erro ao buscar especialidades:", error);
        toast({ title: "Erro", description: "Não foi possível carregar as especialidades.", variant: "destructive"});
      } finally {
        setIsLoadingSpecialties(false);
      }
    };
    fetchSpecialties();
  }, [toast]);


  // Efeito para buscar médicos sempre que a especialidade mudar
  useEffect(() => {
    if (!selectedSpecialty) {
      setDoctors([]);
      setSelectedDoctor("");
      return;
    }

    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            medicos!inner(especialidades)
          `)
          .eq('user_type', 'medico')
          .contains('medicos.especialidades', [selectedSpecialty]);

        if (error) throw error;

        const formattedDoctors = data.map(profile => ({
          id: profile.id,
          display_name: profile.display_name || "Médico sem nome"
        }));
        setDoctors(formattedDoctors);
      } catch (error) {
        console.error("Erro ao buscar médicos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível buscar os médicos. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [selectedSpecialty, toast]);

  // New useEffect to fetch available time slots when doctor and date are selected
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableTimeSlots([]);
      setSelectedTime("");
      return;
    }

    const fetchAvailableTimeSlots = async () => {
      setIsLoadingTimeSlots(true);
      try {
        // Fetch doctor configuration
        const { data: doctorData, error: doctorError } = await supabase
          .from('medicos')
          .select('configuracoes')
          .eq('user_id', selectedDoctor)
          .single();

        if (doctorError) throw doctorError;

        // Fetch existing appointments for the selected date and doctor
        const startOfDay = new Date(selectedDate + 'T00:00:00').toISOString();
        const endOfDay = new Date(selectedDate + 'T23:59:59').toISOString();

        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('consultas')
          .select('data_consulta')
          .eq('medico_id', selectedDoctor)
          .gte('data_consulta', startOfDay)
          .lte('data_consulta', endOfDay)
          .in('status', ['agendada', 'confirmada']);

        if (appointmentsError) throw appointmentsError;

        // Extract time strings from existing appointments
        const existingAppointmentTimes = appointmentsData.map(appointment => {
          const date = new Date(appointment.data_consulta);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        });

        // Get doctor configuration or use defaults with proper type checking
        let doctorConfig: DoctorConfig;
        
        if (doctorData?.configuracoes && typeof doctorData.configuracoes === 'object' && doctorData.configuracoes !== null) {
          // Type-safe casting with validation
          const config = doctorData.configuracoes as any;
          doctorConfig = {
            duracaoConsulta: config.duracaoConsulta || 30,
            horarioAtendimento: config.horarioAtendimento || getDefaultWorkingHours()
          };
        } else {
          // Use default configuration
          doctorConfig = {
            duracaoConsulta: 30,
            horarioAtendimento: getDefaultWorkingHours()
          };
        }

        // Generate available time slots
        const selectedDateObj = new Date(selectedDate + 'T00:00:00');
        const timeSlots = generateTimeSlots(doctorConfig, selectedDateObj, existingAppointmentTimes);
        
        setAvailableTimeSlots(timeSlots);

      } catch (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os horários disponíveis.",
          variant: "destructive"
        });
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    fetchAvailableTimeSlots();
  }, [selectedDoctor, selectedDate, toast]);

  // Função para lidar com o agendamento final
  const handleAgendamento = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para agendar.", variant: "destructive" });
      return;
    }
    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const dataHoraConsulta = new Date(`${selectedDate}T${selectedTime}:00`);

    try {
      const { error } = await supabase
        .from('consultas')
        .insert({
          paciente_id: user.id,
          medico_id: selectedDoctor, // selectedDoctor agora é o ID
          data_consulta: dataHoraConsulta.toISOString(),
          status: 'agendada',
          motivo: 'Consulta solicitada via plataforma.',
          tipo_consulta: selectedSpecialty
        });

      if (error) throw error;

      toast({
        title: "Consulta Agendada!",
        description: `Sua consulta foi agendada com sucesso para ${selectedDate} às ${selectedTime}.`
      });
      
      navigate("/agenda-paciente");

    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast({
        title: "Erro no Agendamento",
        description: "Não foi possível agendar sua consulta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedDoctorName = doctors.find(doc => doc.id === selectedDoctor)?.display_name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-blue-900">Agendar Consulta</h1>
          <p className="text-gray-600">Escolha a especialidade, médico e horário</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Agendamento */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dados da Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Especialidade */}
              <div>
                <label className="block text-sm font-medium mb-2">Especialidade</label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  disabled={isLoadingSpecialties}
                >
                  <option value="">
                    {isLoadingSpecialties ? "Carregando..." : "Selecione uma especialidade"}
                  </option>
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              {/* Médico */}
              {selectedSpecialty && (
                <div>
                  <label className="block text-sm font-medium mb-2">Médico</label>
                  <div className="relative">
                    <select 
                      className="w-full p-3 border rounded-lg appearance-none"
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      disabled={isLoadingDoctors || doctors.length === 0}
                    >
                      <option value="">
                        {isLoadingDoctors 
                          ? "Carregando médicos..." 
                          : doctors.length === 0
                            ? "Nenhum médico encontrado"
                            : "Selecione um médico"}
                      </option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>{doctor.display_name}</option>
                      ))}
                    </select>
                    {isLoadingDoctors && <Loader2 className="animate-spin absolute right-3 top-3.5 h-5 w-5 text-gray-400" />}
                  </div>
                </div>
              )}

              {/* Data */}
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <input 
                  type="date"
                  className="w-full p-3 border rounded-lg"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Horário */}
              {selectedDate && selectedDoctor && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horário 
                    {isLoadingTimeSlots && <span className="ml-2 text-xs text-gray-500">(Carregando...)</span>}
                  </label>
                  {isLoadingTimeSlots ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg">
                      Nenhum horário disponível para esta data
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimeSlots.map(slot => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`text-sm ${!slot.available 
                            ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" 
                            : ""
                          }`}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleAgendamento}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </CardContent>
          </Card>

          {/* Resumo */}
          {selectedSpecialty && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Resumo do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Especialidade</p>
                    <p className="text-sm text-gray-600">{selectedSpecialty}</p>
                  </div>
                </div>

                {selectedDoctor && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Médico</p>
                      <p className="text-sm text-gray-600">{selectedDoctorName}</p>
                    </div>
                  </div>
                )}

                {selectedDate && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Data</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Horário</p>
                      <p className="text-sm text-gray-600">{selectedTime}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Agendamento;
