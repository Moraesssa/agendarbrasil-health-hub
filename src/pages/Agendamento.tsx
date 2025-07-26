
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
import { useAppointmentScheduling } from '@/hooks/useAppointmentScheduling';

const Agendamento = () => {
  const {
    step,
    specialty,
    state,
    city,
    selectedDoctor,
    selectedDate,
    selectedTimeSlot,
    selectedFamilyMember,
    appointmentType,
    loading,
    setStep,
    setSpecialty,
    setState,
    setCity,
    setSelectedDoctor,
    setSelectedDate,
    setSelectedTimeSlot,
    setSelectedFamilyMember,
    setAppointmentType,
    scheduleAppointment,
    reset
  } = useAppointmentScheduling();

  const handleNext = () => {
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSchedule = async () => {
    const success = await scheduleAppointment();
    if (success) {
      setStep(7); // Confirmation step
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <SpecialtySelect
            value={specialty}
            onChange={setSpecialty}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <StateSelect
            value={state}
            onChange={(value) => {
              setState(value);
              setCity('');
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <CitySelect
            state={state}
            value={city}
            onChange={setCity}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <DoctorSelect
            specialty={specialty}
            city={city}
            state={state}
            selectedDoctor={selectedDoctor}
            onDoctorSelect={setSelectedDoctor}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <DateSelect
            doctorId={selectedDoctor?.id || ''}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <TimeSlotGrid
            doctorId={selectedDoctor?.id || ''}
            date={selectedDate}
            selectedSlot={selectedTimeSlot}
            onSlotSelect={setSelectedTimeSlot}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <AppointmentSummary
            doctor={selectedDoctor}
            date={selectedDate}
            timeSlot={selectedTimeSlot}
            appointmentType={appointmentType}
            familyMember={selectedFamilyMember}
            onConfirm={handleSchedule}
            onPrevious={handlePrevious}
            loading={loading}
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
