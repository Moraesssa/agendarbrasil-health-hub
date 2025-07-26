
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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

  const { isLoading, isSubmitting } = state;
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
            value={selectedSpecialty}
            onChange={setSelectedSpecialty}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <StateSelect
            value={selectedState}
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
            state={selectedState}
            value={selectedCity}
            onChange={setSelectedCity}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <DoctorSelect
            specialty={selectedSpecialty}
            city={selectedCity}
            state={selectedState}
            selectedDoctor={doctors.find(d => d.id === selectedDoctor)}
            onDoctorSelect={(doctor) => setSelectedDoctor(doctor.id)}
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
            doctorId={selectedDoctor || ''}
            date={selectedDate}
            selectedSlot={selectedTime}
            onSlotSelect={setSelectedTime}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <AppointmentSummary
            doctor={doctors.find(d => d.id === selectedDoctor)}
            date={selectedDate}
            timeSlot={selectedTime}
            appointmentType={selectedSpecialty}
            familyMember={selectedFamilyMember}
            onConfirm={handleSchedule}
            onPrevious={handlePrevious}
            loading={isSubmitting}
          />
        );
      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                Consulta Agendada com Sucesso!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>Sua consulta foi agendada. Você receberá uma confirmação em breve.</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.href = '/agenda-paciente'}>
                  Ver Minhas Consultas
                </Button>
                <Button variant="outline" onClick={reset}>
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Agendamento de Consulta</h1>
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i + 1 <= step ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {renderStep()}
    </div>
  );
};

export default Agendamento;
