
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAppointmentScheduling } from "@/hooks/useAppointmentScheduling";
import { SpecialtySelect } from "@/components/scheduling/SpecialtySelect";
import { DoctorSelect } from "@/components/scheduling/DoctorSelect";
import { DateSelect } from "@/components/scheduling/DateSelect";
import { TimeSlotGrid } from "@/components/scheduling/TimeSlotGrid";
import { AppointmentSummary } from "@/components/scheduling/AppointmentSummary";

const Agendamento = () => {
  const navigate = useNavigate();
  const {
    // State
    selectedSpecialty,
    selectedDoctor,
    selectedDate,
    selectedTime,
    selectedDoctorName,
    
    // Data
    specialties,
    doctors,
    availableTimeSlots,
    
    // Loading states
    isLoadingSpecialties,
    isLoadingDoctors,
    isLoadingTimeSlots,
    isSubmitting,
    
    // Error states
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
  } = useAppointmentScheduling();

  // Tratamento de erros nas buscas
  if (isErrorSpecialties) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar especialidades</h2>
            <p>{(errorSpecialties as Error)?.message || "Erro desconhecido"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isErrorDoctors) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar médicos</h2>
            <p>{(errorDoctors as Error)?.message || "Erro desconhecido"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isErrorTimeSlots) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar horários</h2>
            <p>{(errorTimeSlots as Error)?.message || "Erro desconhecido"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Verifica se todos os campos obrigatórios estão preenchidos
  const isFormComplete = selectedSpecialty && selectedDoctor && selectedDate && selectedTime;

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
                <ArrowLeft className="h-5 w-5" />
                Dados da Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SpecialtySelect
                specialties={specialties}
                selectedSpecialty={selectedSpecialty}
                isLoading={isLoadingSpecialties}
                onChange={handleSpecialtyChange}
              />

              <DoctorSelect
                doctors={doctors}
                selectedDoctor={selectedDoctor}
                selectedSpecialty={selectedSpecialty}
                isLoading={isLoadingDoctors}
                onChange={handleDoctorChange}
              />

              <DateSelect
                selectedDate={selectedDate}
                selectedDoctor={selectedDoctor}
                onChange={handleDateChange}
              />

              <TimeSlotGrid
                timeSlots={availableTimeSlots}
                selectedTime={selectedTime}
                selectedDate={selectedDate}
                selectedDoctor={selectedDoctor}
                isLoading={isLoadingTimeSlots}
                onChange={setSelectedTime}
              />
              
              <Button 
                onClick={handleAgendamento} 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg" 
                disabled={isSubmitting || !isFormComplete}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </CardContent>
          </Card>

          <AppointmentSummary
            selectedSpecialty={selectedSpecialty}
            selectedDoctorName={selectedDoctorName}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
          />
        </div>
      </main>
    </div>
  );
};

export default Agendamento;
