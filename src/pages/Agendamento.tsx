
import { ArrowLeft, Loader2, Calendar, MapPin, AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useFamilyAppointmentScheduling } from "@/hooks/useFamilyAppointmentScheduling";
import { SpecialtySelect } from "@/components/scheduling/SpecialtySelect";
import { StateSelect } from "@/components/scheduling/StateSelect";
import { CitySelect } from "@/components/scheduling/CitySelect";
import { DoctorSelect } from "@/components/scheduling/DoctorSelect";
import { DateSelect } from "@/components/scheduling/DateSelect";
import { AppointmentSummary } from "@/components/scheduling/AppointmentSummary";
import { TimeSlotGrid } from "@/components/scheduling/TimeSlotGrid";
import { PaymentModal } from "@/components/financial/PaymentModal";
import { FamilyMemberSelect } from "@/components/scheduling/FamilyMemberSelect";
import { WaitingListDialog } from "@/components/scheduling/WaitingListDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { enhancedAppointmentService } from "@/services/enhancedAppointmentService";

const Agendamento = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { models, setters, state, actions } = useFamilyAppointmentScheduling();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [consultaId, setConsultaId] = useState<string | null>(null);
  const [temporaryReservationId, setTemporaryReservationId] = useState<string | null>(null);
  const [reservationTimer, setReservationTimer] = useState<number>(0);

  const selectedDoctorInfo = models.doctors.find(d => d.id === models.selectedDoctor);
  
  const isFormComplete = models.selectedSpecialty && models.selectedState && models.selectedCity && models.selectedDoctor && models.selectedTime && models.selectedLocal && models.selectedPatientId;

  // Timer para reserva temporária
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (reservationTimer > 0) {
      interval = setInterval(() => {
        setReservationTimer(prev => {
          if (prev <= 1) {
            setTemporaryReservationId(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [reservationTimer]);

  // Limpeza ao sair da página
  useEffect(() => {
    return () => {
      enhancedAppointmentService.cleanupSessionReservations();
    };
  }, []);

  // Gerar ID único para a consulta antes do pagamento
  const generateConsultaId = () => {
    return 'consulta_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const handleTimeSelection = async (time: string, local: any) => {
    if (!models.selectedDoctor || !models.selectedDate) return;

    // Criar reserva temporária
    const reservationResult = await enhancedAppointmentService.createTemporaryReservation(
      models.selectedDoctor,
      `${models.selectedDate}T${time}:00`,
      local.id
    );

    if (reservationResult.success && reservationResult.reservationId) {
      setTemporaryReservationId(reservationResult.reservationId);
      setReservationTimer(15 * 60); // 15 minutos em segundos
      setters.setSelectedTime(time);
      setters.setSelectedLocal(local);
    } else {
      // Mostrar erro e opção de lista de espera
      alert(reservationResult.error || "Horário não disponível");
    }
  };

  const handleConfirmAppointment = () => {
    if (isFormComplete && temporaryReservationId) {
      // Gerar ID real para a consulta
      const newConsultaId = generateConsultaId();
      setConsultaId(newConsultaId);
      
      // Para consultas particulares, mostrar modal de pagamento
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async () => {
    if (temporaryReservationId && models.selectedSpecialty) {
      // Confirmar reserva temporária
      const result = await enhancedAppointmentService.confirmTemporaryReservation(
        temporaryReservationId,
        {
          tipo_consulta: models.selectedSpecialty,
          motivo: "Consulta agendada via plataforma",
          valor: 150
        }
      );

      if (result.success) {
        setShowPaymentModal(false);
        setTemporaryReservationId(null);
        setReservationTimer(0);
        navigate("/agenda-paciente?payment=success");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 flex items-center gap-2 hover:bg-accent text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar
            </Button>
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Agendar Consulta
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Encontre o profissional ideal para você em poucos passos
              </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Coluna Principal de Agendamento */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border border-border/50 backdrop-blur-sm bg-card/50">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
                  <CardTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-primary" />
                    Filtros de Agendamento
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Siga os passos para encontrar um horário disponível
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-10 p-8">
                  {/* --- ETAPA 0: SELEÇÃO DO PACIENTE --- */}
                  {user && (
                    <div className="space-y-6 p-6 bg-accent/20 rounded-lg border border-border/30">
                      <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        Selecione o Paciente
                      </div>
                      <FamilyMemberSelect
                        familyMembers={models.familyMembers}
                        selectedMemberId={models.selectedPatientId}
                        currentUserId={user.id}
                        currentUserName={user.email || 'Usuário'}
                        isLoading={state.isLoading}
                        onChange={setters.setSelectedPatientId}
                      />
                    </div>
                  )}

                  {/* --- ETAPA 1: ESPECIALIDADE E LOCALIZAÇÃO --- */}
                  <div className="space-y-6 p-6 bg-accent/20 rounded-lg border border-border/30">
                    <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      Especialidade e Localização
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <SpecialtySelect 
                          specialties={models.specialties} 
                          selectedSpecialty={models.selectedSpecialty} 
                          isLoading={state.isLoading} 
                           onChange={(v) => { setters.setSelectedSpecialty(v); actions.resetSelection('state'); }} 
                           disabled={!models.selectedPatientId}
                       />
                       <StateSelect 
                           states={models.states} 
                           selectedState={models.selectedState} 
                           isLoading={state.isLoading} 
                           onChange={(v) => { setters.setSelectedState(v); actions.resetSelection('city'); }} 
                           disabled={!models.selectedSpecialty || !models.selectedPatientId}
                       />
                       <CitySelect 
                           cities={models.cities} 
                           selectedCity={models.selectedCity} 
                           isLoading={state.isLoading} 
                           onChange={(v) => { setters.setSelectedCity(v); actions.resetSelection('doctor'); }} 
                           disabled={!models.selectedState || !models.selectedPatientId}
                       />
                    </div>
                  </div>

                  {/* Mostrar aviso se não há estados disponíveis */}
                  {!state.isLoading && models.specialties.length > 0 && models.states.length === 0 && (
                    <Alert className="bg-destructive/10 border-destructive/20 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-destructive">
                        Não há médicos disponíveis no momento. Verifique novamente mais tarde ou entre em contato conosco.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* --- ETAPA 2: MÉDICO E DATA --- */}
                  <div className="space-y-6 p-6 bg-accent/20 rounded-lg border border-border/30">
                    <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      Médico e Data
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DoctorSelect 
                          doctors={models.doctors} 
                          selectedDoctor={models.selectedDoctor} 
                          isLoading={state.isLoading} 
                           onChange={(v) => { setters.setSelectedDoctor(v); actions.resetSelection('date'); }} 
                           disabled={!models.selectedCity || !models.selectedPatientId} 
                       />
                       <DateSelect 
                           selectedDate={models.selectedDate} 
                           onChange={(d) => { setters.setSelectedDate(d); actions.resetSelection('date'); }} 
                           disabled={!models.selectedDoctor || !models.selectedPatientId}
                       />
                    </div>
                  </div>

                  {/* --- ETAPA 3: LOCAIS E HORÁRIOS --- */}
                  {models.selectedDate && models.locaisComHorarios.length > 0 && (
                      <div className="space-y-6 p-6 bg-accent/20 rounded-lg border border-border/30">
                        <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                          Locais e Horários Disponíveis
                        </div>
                        <div className="space-y-6">
                          {models.locaisComHorarios.map(local => (
                              <div key={local.id} className="p-6 border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                                  <h3 className="font-semibold text-lg flex items-center gap-3 text-foreground mb-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    {local.nome_local}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-4 ml-8">{local.endereco.logradouro}, {local.endereco.numero}</p>
                                   <TimeSlotGrid
                                       timeSlots={local.horarios_disponiveis}
                                       selectedTime={models.selectedLocal?.id === local.id ? models.selectedTime : ""}
                                       isLoading={state.isLoading}
                                       onChange={(time) => handleTimeSelection(time, local)}
                                   />
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                  
                  
                   {/* --- RESERVA TEMPORÁRIA E CONFIRMAÇÃO --- */}
                  {temporaryReservationId && (
                    <div className="space-y-4 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 text-lg font-medium text-yellow-800">
                        <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">⏰</div>
                        Horário Reservado Temporariamente
                      </div>
                      <p className="text-yellow-700">
                        Seu horário está reservado por mais <strong>{Math.floor(reservationTimer / 60)}:{(reservationTimer % 60).toString().padStart(2, '0')}</strong> minutos.
                        Complete o pagamento para confirmar a consulta.
                      </p>
                      <Button 
                        onClick={handleConfirmAppointment} 
                        size="lg"
                        className="w-full text-lg py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200" 
                        disabled={state.isSubmitting}
                      >
                        {state.isSubmitting ? (
                          <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-3 h-6 w-6" />
                            Confirmar e Pagar
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* --- LISTA DE ESPERA --- */}
                  {models.selectedDate && !state.isLoading && models.locaisComHorarios.length === 0 && models.selectedDoctor && selectedDoctorInfo && (
                    <div className="space-y-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                          <Calendar className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-blue-900 mb-2">Nenhum horário disponível</h3>
                          <p className="text-blue-700 mb-4">
                            Não há horários disponíveis para {selectedDoctorInfo.display_name} na data selecionada.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button 
                            variant="outline" 
                            onClick={() => setters.setSelectedDate("")}
                            className="border-blue-300 hover:bg-blue-50"
                          >
                            Escolher Outra Data
                          </Button>
                          <WaitingListDialog
                            medicoId={models.selectedDoctor}
                            medicoNome={selectedDoctorInfo.display_name || "Médico"}
                            especialidade={models.selectedSpecialty}
                            localId={models.locaisComHorarios[0]?.id}
                            trigger={
                              <Button className="bg-blue-600 hover:bg-blue-700">
                                Entrar na Lista de Espera
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
          
          {/* Coluna de Resumo */}
          <div className="lg:col-span-1 sticky top-24 space-y-6">
            <AppointmentSummary 
              selectedSpecialty={models.selectedSpecialty}
              selectedDoctorName={selectedDoctorInfo?.display_name || ''}
              selectedState={models.selectedState}
              selectedCity={models.selectedCity}
              selectedDate={models.selectedDate}
              selectedTime={models.selectedTime}
              selectedLocal={models.selectedLocal}
              selectedPatientName={
                models.selectedPatientId === user?.id 
                  ? "Para você" 
                  : models.familyMembers.find(m => m.family_member_id === models.selectedPatientId)?.display_name || "Paciente"
              }
            />
          </div>
        </div>

        {/* Modal de Pagamento */}
        {showPaymentModal && models.selectedLocal && selectedDoctorInfo && consultaId && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            consultaData={{
              id: consultaId, // Usar ID real gerado
              valor: 150, // Valor fixo por enquanto
              medicoNome: selectedDoctorInfo.display_name || 'Médico',
              medicoId: selectedDoctorInfo.id,
              dataConsulta: `${models.selectedDate}T${models.selectedTime}:00`,
              especialidade: models.selectedSpecialty
            }}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default Agendamento;
