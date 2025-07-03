
import { ArrowLeft, Loader2, Calendar, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useReturnAppointment } from "@/hooks/useReturnAppointment";
import { PatientHistorySelect } from "@/components/scheduling/PatientHistorySelect";
import { DateSelect } from "@/components/scheduling/DateSelect";
import { TimeSlotGrid } from "@/components/scheduling/TimeSlotGrid";
import { ReturnSummary } from "@/components/scheduling/ReturnSummary";

const MarcarRetorno = () => {
  const navigate = useNavigate();
  const { models, setters, state, actions } = useReturnAppointment();

  const isFormComplete = models.selectedPatient && models.selectedDate && models.selectedTime && models.selectedLocal;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12">
          <Button variant="ghost" onClick={() => navigate("/dashboard-medico")} className="mb-8 flex items-center gap-2 hover:bg-accent text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Marcar Retorno
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Agende consultas de retorno para seus pacientes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Coluna Principal */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border border-border/50 backdrop-blur-sm bg-card/50">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="text-2xl font-semibold text-foreground flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  Agendamento de Retorno
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Selecione o paciente e horário para a consulta de retorno
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-10 p-8">
                
                {/* Seleção do Paciente */}
                <div className="space-y-6 p-6 bg-accent/20 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    Selecionar Paciente
                  </div>
                  <PatientHistorySelect 
                    patients={models.patients}
                    selectedPatient={models.selectedPatient}
                    isLoading={state.isLoading}
                    onChange={setters.setSelectedPatient}
                  />
                </div>

                {/* Seleção de Data */}
                <div className="space-y-6 p-6 bg-accent/20 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    Data da Consulta
                  </div>
                  <DateSelect 
                    selectedDate={models.selectedDate}
                    onChange={(d) => { setters.setSelectedDate(d); actions.resetSelection('time'); }}
                    disabled={!models.selectedPatient}
                  />
                </div>

                {/* Horários Disponíveis */}
                {models.selectedDate && models.availableSlots.length > 0 && (
                  <div className="space-y-6 p-6 bg-accent/20 rounded-lg border border-border/30">
                    <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      Horários Disponíveis
                    </div>
                    <div className="space-y-6">
                      {models.availableSlots.map(local => (
                        <div key={local.id} className="p-6 border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-lg flex items-center gap-3 text-foreground mb-2">
                            <Clock className="h-5 w-5 text-primary" />
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

                {/* Botão de Confirmação */}
                {isFormComplete && (
                  <div className="space-y-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      Confirmar Retorno
                    </div>
                    <Button 
                      onClick={actions.handleScheduleReturn} 
                      size="lg"
                      className="w-full text-lg py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={state.isSubmitting}
                    >
                      {state.isSubmitting ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-3 h-6 w-6" />
                          Confirmar Retorno
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
            <ReturnSummary 
              selectedPatient={models.selectedPatient}
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

export default MarcarRetorno;
