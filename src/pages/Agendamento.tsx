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
  const {
    selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedDoctorName,
    specialties, states, cities, doctors, availableTimeSlots,
    isLoadingSpecialties, isLoadingLocations, isLoadingDoctors, isLoadingTimeSlots, isSubmitting,
    handleSpecialtyChange, handleStateChange, handleCityChange, handleDoctorChange, handleDateChange, setSelectedTime, handleAgendamento,
  } = useAppointmentScheduling();

  const isFormComplete = selectedSpecialty && selectedState && selectedCity && selectedDoctor && selectedDate && selectedTime;

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
          <p className="text-gray-600">Encontre o profissional ideal para você</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-blue-600" />
                Filtrar e Agendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SpecialtySelect
                specialties={specialties}
                selectedSpecialty={selectedSpecialty}
                isLoading={isLoadingSpecialties}
                onChange={handleSpecialtyChange}
              />
              
              <StateSelect
                states={states}
                selectedState={selectedState}
                isLoading={isLoadingLocations}
                onChange={handleStateChange}
                disabled={!selectedSpecialty}
              />

              <CitySelect
                cities={cities}
                selectedCity={selectedCity}
                isLoading={isLoadingLocations}
                onChange={handleCityChange}
                disabled={!selectedState}
              />

              <DoctorSelect
                doctors={doctors}
                selectedDoctor={selectedDoctor}
                isLoading={isLoadingDoctors}
                onChange={handleDoctorChange}
                disabled={!selectedCity}
              />

              <DateSelect
                selectedDate={selectedDate}
                onChange={handleDateChange}
                disabled={!selectedDoctor}
              />

              <TimeSlotGrid
                timeSlots={availableTimeSlots}
                selectedTime={selectedTime}
                isLoading={isLoadingTimeSlots}
                onChange={setSelectedTime}
                disabled={!selectedDate}
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
            selectedCity={selectedCity}
            selectedState={selectedState}
          />
        </div>
      </main>
    </div>
  );
};

export default Agendamento;
