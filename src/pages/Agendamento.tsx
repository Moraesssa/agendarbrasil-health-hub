
import { useState, useEffect } from "react";
import { Calendar, Clock, User, ArrowLeft, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateTimeSlots, getDefaultWorkingHours, type TimeSlot, type DoctorConfig } from "@/utils/timeSlotUtils";
import { logger } from "@/utils/logger";
import { appointmentService, type Medico } from "@/services/appointmentService";

const Agendamento = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados do formulário
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Buscando especialidades
  const {
    data: specialties,
    isLoading: isLoadingSpecialties,
    isError: isErrorSpecialties,
    error: errorSpecialties
  } = useQuery<string[], Error>({
    queryKey: ['specialties'],
    queryFn: async () => {
      logger.info("Fetching specialties for appointment scheduling", "Agendamento");
      try {
        const { data, error } = await supabase.rpc('get_specialties');

        if (error) throw error;
        
        return (data as string[] || []).sort();
      } catch (err) {
        logger.error("Error fetching specialties", "Agendamento", err);
        throw err;
      }
    },
    staleTime: Infinity,
  });

  // Busca de médicos por especialidade selecionada
  const {
    data: doctors,
    isLoading: isLoadingDoctors,
    isError: isErrorDoctors,
    error: errorDoctors
  } = useQuery<Medico[], Error>({
    queryKey: ['doctors', selectedSpecialty],
    queryFn: () => {
      if (!selectedSpecialty) return [];
      return appointmentService.getDoctorsBySpecialty(selectedSpecialty);
    },
    enabled: !!selectedSpecialty,
  });

  // Busca de horários disponíveis para médico e data selecionados
  const {
    data: availableTimeSlots,
    isLoading: isLoadingTimeSlots,
    isError: isErrorTimeSlots,
    error: errorTimeSlots
  } = useQuery<TimeSlot[], Error>({
    queryKey: ['timeSlots', selectedDoctor, selectedDate],
    queryFn: () => {
      if (!selectedDoctor || !selectedDate) return [];
      return appointmentService.getAvailableTimeSlots(selectedDoctor, selectedDate);
    },
    enabled: !!selectedDoctor && !!selectedDate,
  });

  // Mutação para agendar a consulta
  const { mutate: scheduleAppointment, isPending: isSubmitting } = useMutation({
    mutationFn: appointmentService.scheduleAppointment,
    onSuccess: () => {
      toast({
        title: "Consulta Agendada!",
        description: `Sua consulta foi agendada com sucesso para ${selectedDate} às ${selectedTime}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['consultas'] }); 
      navigate("/agenda-paciente");
    },
    onError: (error: Error) => {
      console.error("Erro ao agendar consulta:", error);
      toast({
        title: "Erro no Agendamento",
        description: error.message || "Não foi possível agendar sua consulta. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Handler para resetar seleções quando especialidade muda
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setSelectedDoctor("");
    setSelectedDate("");
    setSelectedTime("");
  };

  // Handler para resetar data e horário quando médico muda
  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setSelectedDate("");
    setSelectedTime("");
  };

  // Handler para resetar horário quando a data muda
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  // Handler para agendar a consulta
  const handleAgendamento = () => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para agendar.", variant: "destructive" });
      return;
    }
    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos", variant: "destructive" });
      return;
    }

    const dataHoraConsulta = new Date(`${selectedDate}T${selectedTime}:00`);
    scheduleAppointment({
      paciente_id: user.id,
      medico_id: selectedDoctor,
      data_consulta: dataHoraConsulta.toISOString(),
      tipo_consulta: selectedSpecialty
    });
  };
  
  const selectedDoctorName = doctors?.find(doc => doc.id === selectedDoctor)?.display_name;

  // Tratamento de erros nas buscas
  if (isErrorSpecialties) return <div className="text-red-500">Erro ao carregar especialidades: {(errorSpecialties as Error).message}</div>;
  if (isErrorDoctors) return <div className="text-red-500">Erro ao carregar médicos: {(errorDoctors as Error).message}</div>;
  if (isErrorTimeSlots) return <div className="text-red-500">Erro ao carregar horários: {(errorTimeSlots as Error).message}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-blue-900">Agendar Consulta</h1>
          <p className="text-gray-600">Escolha a especialidade, médico e horário</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  onChange={(e) => handleSpecialtyChange(e.target.value)} 
                  disabled={isLoadingSpecialties}
                >
                  <option value="">{isLoadingSpecialties ? "Carregando..." : "Selecione uma especialidade"}</option>
                  {specialties?.map(s => <option key={s} value={s}>{s}</option>)}
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
                      onChange={(e) => handleDoctorChange(e.target.value)} 
                      disabled={isLoadingDoctors || !doctors || doctors.length === 0}
                    >
                      <option value="">{isLoadingDoctors ? "Carregando médicos..." : doctors?.length === 0 ? "Nenhum médico encontrado" : "Selecione um médico"}</option>
                      {doctors?.map(d => <option key={d.id} value={d.id}>{d.display_name}</option>)}
                    </select>
                    {isLoadingDoctors && <Loader2 className="animate-spin absolute right-3 top-3.5 h-5 w-5 text-gray-400" />}
                  </div>
                </div>
              )}

              {/* Data */}
              {selectedDoctor && (
                <div>
                  <label className="block text-sm font-medium mb-2">Data</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border rounded-lg" 
                    value={selectedDate} 
                    onChange={(e) => handleDateChange(e.target.value)} 
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              {/* Horário */}
              {selectedDate && selectedDoctor && (
                <div>
                  <label className="block text-sm font-medium mb-2">Horário {isLoadingTimeSlots && "(Carregando...)"}</label>
                  {isLoadingTimeSlots ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimeSlots?.length === 0 ? <p className="col-span-full text-center text-gray-500">Nenhum horário disponível.</p> : null}
                      {availableTimeSlots?.map((slot: TimeSlot) => (
                        <Button 
                          key={slot.time} 
                          variant={selectedTime === slot.time ? "default" : "outline"} 
                          onClick={() => setSelectedTime(slot.time)} 
                          disabled={!slot.available}
                          className={`text-sm ${!slot.available ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" : ""}`}
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
                disabled={isSubmitting || !selectedTime}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </CardContent>
          </Card>

          {/* Resumo */}
          {selectedSpecialty && selectedDoctor && selectedDate && selectedTime && (
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Resumo do Agendamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"><User className="h-5 w-5 text-blue-600" /><div><p className="font-medium">Especialidade</p><p className="text-sm text-gray-600">{selectedSpecialty}</p></div></div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"><User className="h-5 w-5 text-green-600" /><div><p className="font-medium">Médico</p><p className="text-sm text-gray-600">{selectedDoctorName}</p></div></div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg"><Calendar className="h-5 w-5 text-orange-600" /><div><p className="font-medium">Data</p><p className="text-sm text-gray-600">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p></div></div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg"><Clock className="h-5 w-5 text-purple-600" /><div><p className="font-medium">Horário</p><p className="text-sm text-gray-600">{selectedTime}</p></div></div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Agendamento;
