import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SpecialtySelect } from '@/components/scheduling/SpecialtySelect';
import { StateSelect } from '@/components/scheduling/StateSelect';
import { CitySelect } from '@/components/scheduling/CitySelect';
import { DoctorSelect } from '@/components/scheduling/DoctorSelect';
import { DateSelect } from '@/components/scheduling/DateSelect';
import { TimeSlotGrid } from '@/components/scheduling/TimeSlotGrid';
import { AppointmentSummary } from '@/components/scheduling/AppointmentSummary';
import { FamilyMemberSelect } from '@/components/scheduling/FamilyMemberSelect';
import { useAppointmentScheduling } from '@/hooks/useAppointmentScheduling';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { toast } from '@/hooks/use-toast';

const TOTAL_STEPS = 7;

const Agendamento = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState("");
  const { familyMembers } = useFamilyData();

  const appointmentHook = useAppointmentScheduling();
  
  const {
    models: {
      selectedSpecialty,
      selectedState,
      selectedCity,
      selectedDoctor,
      selectedDate,
      selectedTime,
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
  } = appointmentHook;

  const selectedPatientName = selectedFamilyMember 
    ? familyMembers?.find(member => member.id === selectedFamilyMember)?.display_name 
    : user?.user_metadata?.full_name || user?.email || "Usuário";

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

  const handleRestart = () => {
    setStep(1);
    resetSelection('state');
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= step) {
      setStep(stepNumber);
    }
  };

  const handleAppointmentConfirm = async () => {
    try {
      await handleAgendamento();
      
      toast({
        title: "Consulta agendada com sucesso!",
        description: `Sua consulta foi marcada para ${selectedDate} às ${selectedTime}`,
      });
      
      handleRestart();
    } catch (error) {
      toast({
        title: "Erro ao agendar consulta",
        description: "Tente novamente ou entre em contato com o suporte",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <SpecialtySelect
            selectedSpecialty={selectedSpecialty}
            specialties={specialties}
            isLoading={isLoading}
            onChange={setSelectedSpecialty}
            disabled={isLoading}
          />
        );
      case 2:
        return (
          <StateSelect
            selectedState={selectedState}
            states={states}
            isLoading={isLoading}
            onChange={setSelectedState}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <CitySelect
            selectedCity={selectedCity}
            cities={cities}
            isLoading={isLoading}
            onChange={setSelectedCity}
          />
        );
      case 4:
        return (
          <DoctorSelect
            selectedDoctor={selectedDoctor}
            doctors={doctors}
            isLoading={isLoading}
            onChange={setSelectedDoctor}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <DateSelect
            doctorId={selectedDoctor}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <TimeSlotGrid
            selectedTime={selectedTime}
            timeSlots={[{ time: "09:00", available: true }, { time: "10:00", available: true }]}
            isLoading={isLoading}
            onChange={setSelectedTime}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <div className="space-y-4">
            <FamilyMemberSelect
              selectedMemberId={selectedFamilyMember}
              onChange={setSelectedFamilyMember}
              familyMembers={familyMembers || []}
              currentUserId={user?.id || ""}
              currentUserName={user?.user_metadata?.full_name || user?.email || "Você"}
            />
            <AppointmentSummary
              selectedSpecialty={selectedSpecialty}
              selectedDoctorName={doctors?.find(d => d.id === selectedDoctor)?.display_name || selectedDoctor}
              selectedState={selectedState}
              selectedCity={selectedCity}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedLocal={locaisComHorarios?.[0] || null}
              selectedPatientName={selectedPatientName}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const stepTitles = [
    "Especialidade",
    "Estado",
    "Cidade",
    "Médico",
    "Data",
    "Horário",
    "Confirmação"
  ];

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Agendar Consulta
          </CardTitle>
          <div className="text-center text-sm text-muted-foreground">
            Passo {step} de {TOTAL_STEPS}: {stepTitles[step - 1]}
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}
          
          <div className="flex justify-between pt-6">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={isLoading || isSubmitting}
              >
                Anterior
              </Button>
            )}
            
            {step < TOTAL_STEPS && (
              <Button 
                onClick={handleNext} 
                className="ml-auto"
                disabled={
                  isLoading || 
                  (step === 1 && !selectedSpecialty) ||
                  (step === 2 && !selectedState) ||
                  (step === 3 && !selectedCity) ||
                  (step === 4 && !selectedDoctor) ||
                  (step === 5 && !selectedDate) ||
                  (step === 6 && !selectedTime)
                }
              >
                Próximo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agendamento;