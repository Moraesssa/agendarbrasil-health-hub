
import { ArrowLeft, Loader2, Calendar, MapPin, AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useNewAppointmentScheduling } from "@/hooks/useNewAppointmentScheduling";
import { SpecialtySelect } from "@/components/scheduling/SpecialtySelect";
import { StateSelect } from "@/components/scheduling/StateSelect";
import { CitySelect } from "@/components/scheduling/CitySelect";
import { DoctorSelect } from "@/components/scheduling/DoctorSelect";
import { DateSelect } from "@/components/scheduling/DateSelect";
import { AppointmentSummary } from "@/components/scheduling/AppointmentSummary";
import { TimeSlotGrid } from "@/components/scheduling/TimeSlotGrid";
import { PaymentModal } from "@/components/financial/PaymentModal";
import { useState } from "react";

const Agendamento = () => {
  const navigate = useNavigate();
  const { models, setters, state, actions } = useNewAppointmentScheduling();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [consultaId, setConsultaId] = useState<string | null>(null);

  const selectedDoctorInfo = models.doctors.find(d => d.id === models.selectedDoctor);

  const isFormComplete = models.selectedSpecialty && models.selectedState && models.selectedCity && models.selectedDoctor && models.selectedTime && models.selectedLocal;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
            </Button>
            <h1 className="text-4xl font-bold text-center text-gray-800">Agendar Consulta</h1>
            <p className="text-lg text-gray-600 text-center mt-2">Encontre o profissional ideal para você em poucos passos.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Coluna Principal de Agendamento */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0">
              <CardHeader>
                  <CardTitle>Filtros de Agendamento</CardTitle>
                  <CardDescription>Siga os passos para encontrar um horário disponível.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                  {/* --- ETAPA 1: ESPECIALIDADE E LOCALIZAÇÃO --- */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SpecialtySelect 
                          specialties={models.specialties} 
                          selectedSpecialty={models.selectedSpecialty} 
                          isLoading={state.isLoading} 
                          onChange={(v) => { setters.setSelectedSpecialty(v); actions.resetSelection('state'); }} 
                      />
                      <StateSelect 
                          states={models.states} 
                          selectedState={models.selectedState} 
                          isLoading={state.isLoading} 
                          onChange={(v) => { setters.setSelectedState(v); actions.resetSelection('city'); }} 
                          disabled={!models.selectedSpecialty}
                      />
                      <CitySelect 
                          cities={models.cities} 
                          selectedCity={models.selectedCity} 
                          isLoading={state.isLoading} 
                          onChange={(v) => { setters.setSelectedCity(v); actions.resetSelection('doctor'); }} 
                          disabled={!models.selectedState} 
                      />
                  </div>

                  {/* Mostrar aviso se não há estados disponíveis */}
                  {!state.isLoading && models.specialties.length > 0 && models.states.length === 0 && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Não há médicos disponíveis no momento. Verifique novamente mais tarde ou entre em contato conosco.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* --- ETAPA 2: MÉDICO E DATA --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <DoctorSelect 
                          doctors={models.doctors} 
                          selectedDoctor={models.selectedDoctor} 
                          isLoading={state.isLoading} 
                          onChange={(v) => { setters.setSelectedDoctor(v); actions.resetSelection('date'); }} 
                          disabled={!models.selectedCity} 
                      />
                      <DateSelect 
                          selectedDate={models.selectedDate} 
                          onChange={(d) => { setters.setSelectedDate(d); actions.resetSelection('date'); }} 
                          disabled={!models.selectedDoctor} 
                      />
                  </div>

                  {/* --- ETAPA 3: LOCAIS E HORÁRIOS --- */}
                  {models.selectedDate && models.locaisComHorarios.length > 0 && (
                      <div className="pt-4 border-t space-y-6">
                          <h2 className="font-semibold text-lg">Selecione um Local e Horário:</h2>
                          {models.locaisComHorarios.map(local => (
                              <div key={local.id} className="p-4 border rounded-md bg-gray-50">
                                  <h3 className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />{local.nome_local}</h3>
                                  <p className="text-sm text-gray-500 mb-2 ml-6">{local.endereco.logradouro}, {local.endereco.numero}</p>
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
                  )}
                  
                  {models.selectedDate && !state.isLoading && models.locaisComHorarios.length === 0 && (
                    <div className="text-center text-gray-500 pt-4 border-t">
                      <p>Nenhum horário disponível para este médico na data selecionada.</p>
                    </div>
                  )}
                  
                   {/* --- BOTÃO DE CONFIRMAÇÃO --- */}
                  {isFormComplete && (
                    <div className="pt-6 border-t">
                      <Button 
                        onClick={handleConfirmAppointment} 
                        className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700" 
                        disabled={state.isSubmitting}
                      >
                        {state.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
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
          <div className="lg:col-span-1 sticky top-24">
            <AppointmentSummary 
              selectedSpecialty={models.selectedSpecialty}
              selectedDoctorName={selectedDoctorInfo?.display_name || ''}
              selectedState={models.selectedState}
              selectedCity={models.selectedCity}
              selectedDate={models.selectedDate}
              selectedTime={models.selectedTime}
              selectedLocal={models.selectedLocal}
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
