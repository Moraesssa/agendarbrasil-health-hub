import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpecialtySelect } from '@/components/scheduling/SpecialtySelect';
import { StateSelect } from '@/components/scheduling/StateSelect';
import { CitySelect } from '@/components/scheduling/CitySelect';
import { DoctorSelect } from '@/components/scheduling/DoctorSelect';
import { TimeSlotGrid } from '@/components/scheduling/TimeSlotGrid';
import { useNewAppointmentScheduling } from '@/hooks/useNewAppointmentScheduling';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';

const NewAgendamento = () => {
  const { models, setters, state, actions } = useNewAppointmentScheduling();

  const { 
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
  } = models;

  const { 
    setSelectedSpecialty, 
    setSelectedState, 
    setSelectedCity, 
    setSelectedDoctor, 
    setSelectedDate, 
    setSelectedTime,
    setSelectedLocal
  } = setters;

  const { isLoading, isSubmitting, loadingStates, isAnyLoading } = state;
  const { handleAgendamento, resetSelection } = actions;

  // Transform locaisComHorarios to timeSlots format for TimeSlotGrid
  const timeSlots = locaisComHorarios?.flatMap(local => 
    local.horarios_disponiveis?.map(horario => ({
      time: horario,
      available: true
    })) || []
  ) || [];

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date.toISOString().split('T')[0]);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    // Find the local that has this time slot
    const local = locaisComHorarios?.find(l => 
      l.horarios_disponiveis?.includes(time)
    );
    if (local) {
      setSelectedLocal(local);
    }
  };

  const canProceedToBooking = selectedSpecialty && selectedState && selectedCity && 
    selectedDoctor && selectedDate && selectedTime && selectedLocal;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Agendamento de Consulta</CardTitle>
          <div className="text-center text-sm text-gray-500">
            {isAnyLoading && "Carregando dados..."}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Specialty Selection */}
          <SpecialtySelect
            specialties={specialties}
            selectedSpecialty={selectedSpecialty}
            isLoading={loadingStates.specialties}
            onChange={(specialty) => {
              setSelectedSpecialty(specialty);
              resetSelection('state');
            }}
          />

          {/* State Selection */}
          <StateSelect
            states={states}
            selectedState={selectedState}
            isLoading={loadingStates.states}
            onChange={(state) => {
              setSelectedState(state);
              resetSelection('city');
            }}
            disabled={!selectedSpecialty}
          />

          {/* City Selection */}
          <CitySelect
            cities={cities}
            selectedCity={selectedCity}
            isLoading={loadingStates.cities}
            onChange={(city) => {
              setSelectedCity(city);
              resetSelection('doctor');
            }}
            disabled={!selectedState}
          />

          {/* Doctor Selection */}
          <DoctorSelect
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            isLoading={loadingStates.doctors}
            onChange={(doctorId) => {
              setSelectedDoctor(doctorId);
              resetSelection('date');
            }}
            disabled={!selectedCity}
          />

          {/* Date Selection */}
          {selectedDoctor && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data da Consulta</label>
              <DatePicker
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={handleDateChange}
                disabled={!selectedDoctor}
              />
            </div>
          )}

          {/* Time Slot Selection */}
          {selectedDate && (
            <TimeSlotGrid
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              isLoading={loadingStates.timeSlots}
              onChange={handleTimeSelect}
              disabled={!selectedDate}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleAgendamento}
              disabled={!canProceedToBooking || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Agendando..." : "Agendar Consulta"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSpecialty("");
                resetSelection('state');
              }}
              disabled={isSubmitting}
            >
              Limpar
            </Button>
          </div>

          {/* Loading States Debug Info (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Loading States (Debug)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Specialties: {loadingStates.specialties ? '🔄' : '✅'}</div>
                <div>States: {loadingStates.states ? '🔄' : '✅'}</div>
                <div>Cities: {loadingStates.cities ? '🔄' : '✅'}</div>
                <div>Doctors: {loadingStates.doctors ? '🔄' : '✅'}</div>
                <div>Time Slots: {loadingStates.timeSlots ? '🔄' : '✅'}</div>
                <div>Any Loading: {isAnyLoading ? '🔄' : '✅'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewAgendamento;