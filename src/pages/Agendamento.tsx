import { ArrowLeft, Loader2, MapPin } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Início
          </Button>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Agendar Consulta</h1>
          <p className="text-lg text-gray-500 mt-1">Encontre o profissional ideal para você em poucos passos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-lg border-gray-200 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-gray-700">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  Filtrar e Agendar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <SpecialtySelect specialties={hooks.specialties} selectedSpecialty={hooks.selectedSpecialty} isLoading={hooks.isLoadingSpecialties} onChange={hooks.handleSpecialtyChange} />
                  <StateSelect states={hooks.states} selectedState={hooks.selectedState} isLoading={hooks.isLoadingLocations} onChange={hooks.handleStateChange} disabled={!hooks.selectedSpecialty} />
                </div>
                <CitySelect cities={hooks.cities} selectedCity={hooks.selectedCity} isLoading={hooks.isLoadingLocations} onChange={hooks.handleCityChange} disabled={!hooks.selectedState} />
                <DoctorSelect doctors={hooks.doctors} selectedDoctor={hooks.selectedDoctor} isLoading={hooks.isLoadingDoctors} onChange={hooks.handleDoctorChange} disabled={!hooks.selectedCity} />
                <hr className="my-4"/>
                <DateSelect selectedDate={hooks.selectedDate} onChange={hooks.handleDateChange} disabled={!hooks.selectedDoctor} />
                <TimeSlotGrid timeSlots={hooks.availableTimeSlots} selectedTime={hooks.selectedTime} isLoading={hooks.isLoadingTimeSlots} onChange={hooks.setSelectedTime} disabled={!hooks.selectedDate} />
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <AppointmentSummary {...hooks} />
            <Button onClick={hooks.handleAgendamento} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-lg py-6 rounded-lg shadow-md transition-transform transform hover:scale-105" disabled={isSubmitting || !isFormComplete}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agendamento;
