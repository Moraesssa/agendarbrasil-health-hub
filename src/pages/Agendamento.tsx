
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
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Agendamento = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { models, setters, state, actions } = useFamilyAppointmentScheduling();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [consultaId, setConsultaId] = useState<string | null>(null);

  const selectedDoctorInfo = models.doctors.find(d => d.id === models.selectedDoctor);

  const isFormComplete = models.selectedSpecialty && models.selectedState && models.selectedCity && models.selectedDoctor && models.selectedTime && models.selectedLocal && models.selectedPatientId;

  // Gerar ID único para a consulta antes do pagamento
  const generateConsultaId = () => {
    return 'consulta_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const handleConfirmAppointment = () => {
    if (isFormComplete) {
      // Gerar ID real para a consulta
      const newConsultaId = generateConsultaId();
      setConsultaId(newConsultaId);
      
      // Para consultas particulares, mostrar modal de pagamento
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    // Após pagamento bem-sucedido, agendar a consulta
    actions.handleAgendamento();
    setShowPaymentModal(false);
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
                                      onChange={(time) => {
                                          setters.setSelectedTime(time);
                                          setters.setSelectedLocal(local);
                                      }}
                                  />
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                  
                  {models.selectedDate && !state.isLoading && models.locaisComHorarios.length === 0 && (
                    <div className="text-center p-8 space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-lg">Nenhum horário disponível para este médico na data selecionada.</p>
                      <p className="text-sm text-muted-foreground">Tente selecionar uma data diferente.</p>
                    </div>
                  )}
                  
                   {/* --- BOTÃO DE CONFIRMAÇÃO --- */}
                  {isFormComplete && (
                    <div className="space-y-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">5</div>
                        Finalizar Agendamento
                      </div>
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
