
import { ArrowLeft, Loader2, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAppointmentScheduling } from "@/hooks/useAppointmentScheduling";
import { SpecialtySelect } from "@/components/scheduling/SpecialtySelect";
import { StateSelect } from "@/components/scheduling/StateSelect";
import { CitySelect } from "@/components/scheduling/CitySelect";
import { DoctorSelect } from "@/components/scheduling/DoctorSelect";
import { DateSelect } from "@/components/scheduling/DateSelect";
import { TimeSlotGrid } from "@/components/scheduling/TimeSlotGrid";
import { AppointmentSummary } from "@/components/scheduling/AppointmentSummary";

const Agendamento = () => {
  const navigate = useNavigate();
  const hooks = useAppointmentScheduling();
  const { isSubmitting, selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime } = hooks;

  const isFormComplete = selectedSpecialty && selectedState && selectedCity && selectedDoctor && selectedDate && selectedTime;

  // Calcular progresso do formulário
  const steps = [selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime];
  const completedSteps = steps.filter(Boolean).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Início
          </Button>
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Agendamento Inteligente
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 tracking-tight">
              Agendar Consulta
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Encontre o profissional ideal para você em poucos passos simples e rápidos.
            </p>
            
            {/* Barra de Progresso */}
            <div className="max-w-md mx-auto mt-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Progresso</span>
                <span>{completedSteps}/6 passos</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Formulário Principal */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl text-gray-700">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Filtros e Agendamento
                </CardTitle>
                <p className="text-gray-500 mt-2">
                  Preencha os campos abaixo para encontrar o profissional perfeito
                </p>
              </CardHeader>
              
              <CardContent className="space-y-8 p-8 pt-0">
                {/* Seção 1: Localização e Especialidade */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">O que você precisa?</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SpecialtySelect 
                      specialties={hooks.specialties} 
                      selectedSpecialty={hooks.selectedSpecialty} 
                      isLoading={hooks.isLoadingSpecialties} 
                      onChange={hooks.handleSpecialtyChange} 
                    />
                    <StateSelect 
                      states={hooks.states} 
                      selectedState={hooks.selectedState} 
                      isLoading={hooks.isLoadingLocations} 
                      onChange={hooks.handleStateChange} 
                      disabled={!hooks.selectedSpecialty} 
                    />
                  </div>
                  
                  <CitySelect 
                    cities={hooks.cities} 
                    selectedCity={hooks.selectedCity} 
                    isLoading={hooks.isLoadingLocations} 
                    onChange={hooks.handleCityChange} 
                    disabled={!hooks.selectedState} 
                  />
                </div>

                {/* Divisor */}
                {hooks.selectedCity && (
                  <div className="border-t border-gray-200 pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">2</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700">Escolher Profissional</h3>
                    </div>
                    
                    <DoctorSelect 
                      doctors={hooks.doctors} 
                      selectedDoctor={hooks.selectedDoctor} 
                      isLoading={hooks.isLoadingDoctors} 
                      onChange={hooks.handleDoctorChange} 
                      disabled={!hooks.selectedCity} 
                    />
                  </div>
                )}

                {/* Seção 3: Data e Horário */}
                {hooks.selectedDoctor && (
                  <div className="border-t border-gray-200 pt-8 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">3</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700">Data e Horário</h3>
                    </div>
                    
                    <DateSelect 
                      selectedDate={hooks.selectedDate} 
                      onChange={hooks.handleDateChange} 
                      disabled={!hooks.selectedDoctor} 
                    />
                    
                    <TimeSlotGrid 
                      timeSlots={hooks.availableTimeSlots} 
                      selectedTime={hooks.selectedTime} 
                      isLoading={hooks.isLoadingTimeSlots} 
                      onChange={hooks.setSelectedTime} 
                      disabled={!hooks.selectedDate} 
                    />
                  </div>
                )}
                
                {/* Botão de Confirmação */}
                {isFormComplete && (
                  <div className="border-t border-gray-200 pt-8">
                    <Button 
                      onClick={hooks.handleAgendamento} 
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                      disabled={isSubmitting || !isFormComplete}
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-5 w-5" />
                          Confirmar Agendamento
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Resumo Lateral */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <AppointmentSummary {...hooks} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agendamento;
