
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpecialtySelect } from '@/components/scheduling/SpecialtySelect';
import { StateSelect } from '@/components/scheduling/StateSelect';
import { CitySelect } from '@/components/scheduling/CitySelect';
import { DoctorSelect } from '@/components/scheduling/DoctorSelect';
import { DateSelect } from '@/components/scheduling/DateSelect';
import { TimeSlotGrid } from '@/components/scheduling/TimeSlotGrid';
import { FamilyMemberSelect } from '@/components/scheduling/FamilyMemberSelect';
import { AppointmentSummary } from '@/components/scheduling/AppointmentSummary';
import { useNewAppointmentScheduling } from '@/hooks/useNewAppointmentScheduling';

const Agendamento = () => {
  const { models, setters, state, actions } = useNewAppointmentScheduling();
  const [step, setStep] = useState(1);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('');

  const { 
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
  } = models;

  const { 
    setSelectedSpecialty, 
    setSelectedState, 
    setSelectedCity, 
    setSelectedDoctor, 
    setSelectedDate, 
    setSelectedTime 
  } = setters;

  const { isLoading, isSubmitting, loadingStates } = state;
  const { handleAgendamento } = actions;

  const handleNext = () => {
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSchedule = async () => {
    await handleAgendamento();
    setStep(7); // Confirmation step
  };

  const reset = () => {
    setStep(1);
    setSelectedSpecialty('');
    setSelectedState('');
    setSelectedCity('');
    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedFamilyMember('');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <SpecialtySelect
            specialties={specialties}
            selectedSpecialty={selectedSpecialty}
            isLoading={loadingStates.specialties}
            onChange={setSelectedSpecialty}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <StateSelect
            states={states}
            selectedState={selectedState}
            isLoading={loadingStates.states}
            onChange={(value) => {
              setSelectedState(value);
              setSelectedCity('');
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <CitySelect
            cities={cities}
            selectedCity={selectedCity}
            isLoading={loadingStates.cities}
            onChange={setSelectedCity}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <DoctorSelect
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            isLoading={loadingStates.doctors}
            onChange={setSelectedDoctor}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <DateSelect
            doctorId={selectedDoctor || ''}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <TimeSlotGrid
            timeSlots={locaisComHorarios?.flatMap(local => 
              local.horarios_disponiveis?.map(horario => ({
                time: horario,
                available: true
              })) || []
            )}
            selectedTime={selectedTime}
            isLoading={loadingStates.timeSlots}
            onChange={setSelectedTime}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                </div>
                Confirme os Dados
              </CardTitle>
              <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            </CardHeader>
            <CardContent className="space-y-6">
              <AppointmentSummary
                selectedSpecialty={selectedSpecialty}
                selectedDoctorName={doctors.find(d => d.id === selectedDoctor)?.display_name || ''}
                selectedState={selectedState}
                selectedCity={selectedCity}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedLocal={null}
                selectedPatientName={selectedFamilyMember}
              />
              
              <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 h-12 px-6 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Anterior</span>
                </Button>
                <Button
                  onClick={handleSchedule}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 h-12 px-8 font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Agendando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirmar Agendamento</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 8:
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-gradient-to-br from-white to-green-50/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700 mb-2">
                Consulta Agendada com Sucesso!
              </CardTitle>
              <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto"></div>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  Sua consulta foi agendada com sucesso! Você receberá uma confirmação em breve.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => window.location.href = '/agenda-paciente'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Minhas Consultas
                </Button>
                <Button 
                  variant="outline" 
                  onClick={reset}
                  className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Agendar Outra Consulta
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Agendamento de Consulta
            </h1>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/20">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300",
                      i + 1 <= step 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg" 
                        : "bg-gray-200"
                    )}
                  />
                  {i < 6 && (
                    <div 
                      className={cn(
                        "w-8 h-0.5 mx-1 transition-all duration-300",
                        i + 1 < step 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500" 
                          : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step Description */}
          <p className="text-gray-600 font-medium">
            Etapa {step} de 7 - {getStepDescription(step)}
          </p>
        </div>

        {/* Step Content */}
        <div className="flex justify-center">
          {renderStep()}
        </div>
      </div>
    </div>
  );

  function getStepDescription(currentStep: number): string {
    const descriptions = [
      "Selecione a especialidade",
      "Escolha o estado",
      "Selecione a cidade", 
      "Escolha o médico",
      "Selecione a data",
      "Escolha o horário",
      "Confirme os dados",
      "Agendamento concluído"
    ];
    return descriptions[currentStep - 1] || "";
  }
};

export default Agendamento;
