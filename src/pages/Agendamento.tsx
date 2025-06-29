import { ArrowLeft, Loader2, Calendar, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // <-- A importação está aqui
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAppointmentScheduling } from "@/hooks/useAppointmentScheduling";
import { SpecialtySelect } from "@/components/scheduling/SpecialtySelect";
import { StateSelect } from "@/components/scheduling/StateSelect";
import { CitySelect } from "@/components/scheduling/CitySelect";
import { DoctorSelect } from "@/components/scheduling/DoctorSelect";
import { DateSelect } from "@/components/scheduling/DateSelect";
import { AppointmentSummary } from "@/components/scheduling/AppointmentSummary";
import { TimeSlotGrid } from "@/components/scheduling/TimeSlotGrid";

const Agendamento = () => {
  const navigate = useNavigate();
  const { models, setters, state, actions } = useAppointmentScheduling();

  const selectedDoctorInfo = models.doctors.find(d => d.id === models.selectedDoctor);

  const isFormComplete = models.selectedSpecialty && models.selectedState && models.selectedCity && models.selectedDoctor && models.selectedDate && models.selectedTime && models.selectedLocal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
            <h1 className="text-4xl font-bold text-center">Agendar Consulta</h1>
            <p className="text-lg text-gray-600 text-center">Encontre o profissional ideal para você.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader><CardTitle>Filtros e Agendamento</CardTitle></CardHeader>
              <CardContent className="space-y-8">
                  {/* Etapa 1: Especialidade e Localização */}
                  <div className="grid md:grid-cols-3 gap-4">
                      <SpecialtySelect specialties={models.specialties} selectedSpecialty={models.selectedSpecialty} isLoading={state.isLoading} onChange={(v) => { setters.setSelectedSpecialty(v); actions.resetSelection('state'); }} />
                      <StateSelect states={models.states} selectedState={models.selectedState} isLoading={state.isLoading} onChange={(v) => { setters.setSelectedState(v); actions.resetSelection('city'); }} disabled={!models.selectedSpecialty} />
                      <CitySelect cities={models.cities} selectedCity={models.selectedCity} isLoading={state.isLoading} onChange={(v) => { setters.setSelectedCity(v); actions.resetSelection('doctor'); }} disabled={!models.selectedState} />
                  </div>

                  {/* Etapa 2: Médico e Data */}
                  {models.selectedCity && (
                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                          <DoctorSelect doctors={models.doctors} selectedDoctor={models.selectedDoctor} isLoading={state.isLoading} onChange={(v) => { setters.setSelectedDoctor(v); actions.resetSelection('date'); }} disabled={!models.selectedCity} />
                          <DateSelect selectedDate={models.selectedDate} onChange={(d) => { setters.setSelectedDate(d); actions.resetSelection('date'); }} disabled={!models.selectedDoctor} />
                      </div>
                  )}

                  {/* Etapa 3: Locais e Horários */}
                  {models.selectedDate && models.locaisComHorarios.length > 0 && (
                      <div className="pt-4 border-t space-y-6">
                          {models.locaisComHorarios.map(local => (
                              <div key={local.id}>
                                  <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" />{local.nome_local}</h3>
                                  <p className="text-sm text-gray-500 mb-2">{local.endereco.logradouro}, {local.endereco.numero}</p>
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
                  
                   {/* Botão Final */}
                  {isFormComplete && (
                    <div className="pt-6 border-t">
                      <Button onClick={actions.handleAgendamento} className="w-full text-lg py-6" disabled={state.isSubmitting}>
                        {state.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Calendar className="mr-2 h-5 w-5" />}
                        Confirmar Agendamento
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
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
      </main>
    </div>
  );
};

export default Agendamento;
