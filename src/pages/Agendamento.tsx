import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useNewAppointmentScheduling } from "@/hooks/useNewAppointmentScheduling";
import { SpecialtySelect } from "@/components/scheduling/SpecialtySelect";
import { StateSelect } from "@/components/scheduling/StateSelect";
import { CitySelect } from "@/components/scheduling/CitySelect";
import { DoctorSelect } from "@/components/scheduling/DoctorSelect";
import { DateSelect } from "@/components/scheduling/DateSelect";
import { TimeSlotGrid } from "@/components/scheduling/TimeSlotGrid";
import { AppointmentSummary } from "@/components/scheduling/AppointmentSummary";
import { FamilyMemberSelect } from "@/components/scheduling/FamilyMemberSelect";

const TOTAL_STEPS = 7;

const Agendamento = () => {
  const [step, setStep] = useState(1);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState("");

  const {
    models: {
      selectedSpecialty,
      selectedState,
      selectedCity,
      selectedDoctor,
      selectedDate,
      selectedTime,
      selectedLocal,
      specialties,
      states,
      cities,
      doctors,
      locaisComHorarios
    },
    setters: {
      setSelectedSpecialty,
      setSelectedState,
      setSelectedCity,
      setSelectedDoctor,
      setSelectedDate,
      setSelectedTime
    },
    state: { isLoading, isSubmitting },
    actions: { handleAgendamento, resetSelection }
  } = useNewAppointmentScheduling();

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSchedule = async () => {
    await handleAgendamento();
  };

  const reset = () => {
    setStep(1);
    setSelectedFamilyMember("");
    resetSelection('state');
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    resetSelection('state');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <SpecialtySelect
            specialties={specialties}
            selectedSpecialty={selectedSpecialty}
            isLoading={isLoading}
            onChange={setSelectedSpecialty}
          />
        );
      case 2:
        return (
          <StateSelect
            states={states}
            selectedState={selectedState}
            isLoading={isLoading}
            onChange={handleStateChange}
          />
        );
      case 3:
        return (
          <CitySelect
            cities={cities}
            selectedCity={selectedCity}
            isLoading={isLoading}
            onChange={setSelectedCity}
          />
        );
      case 4:
        return (
          <DoctorSelect
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            isLoading={isLoading}
            onChange={setSelectedDoctor}
          />
        );
      case 5:
        return (
          <DateSelect
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
        );
      case 6:
        return (
          <TimeSlotGrid
            timeSlots={(locaisComHorarios || []).length > 0 ? locaisComHorarios[0].horarios_disponiveis : []}
            selectedTime={selectedTime}
            isLoading={isLoading}
            onChange={setSelectedTime}
          />
        );
      case 7:
        return (
          <div className="space-y-4">
            <FamilyMemberSelect
              familyMembers={[]}
              selectedMemberId={selectedFamilyMember}
              currentUserId="current-user"
              currentUserName="Você"
              onChange={setSelectedFamilyMember}
            />
            <AppointmentSummary
              selectedSpecialty={selectedSpecialty}
              selectedDoctorName={doctors.find(d => d.id === selectedDoctor)?.display_name || ''}
              selectedState={selectedState}
              selectedCity={selectedCity}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedLocal={(locaisComHorarios || []).length > 0 ? locaisComHorarios[0] : null}
              selectedPatientName={selectedFamilyMember}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedSpecialty !== "";
      case 2: return selectedState !== "";
      case 3: return selectedCity !== "";
      case 4: return selectedDoctor !== "";
      case 5: return selectedDate !== "";
      case 6: return selectedTime !== "";
      case 7: return true;
      default: return false;
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              Agendar Consulta
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Siga os passos para agendar sua consulta médica
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Passo {step} de {TOTAL_STEPS}</span>
                <span>{Math.round(progress)}% concluído</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="min-h-[400px] flex items-center justify-center">
              {renderStep()}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSchedule}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    "Agendando..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agendamento;