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
import { usePayment } from '@/hooks/usePayment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const TOTAL_STEPS = 7;

const Agendamento = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState("");
  const { familyMembers } = useFamilyData();
  const { processPayment, processing } = usePayment();

  const appointmentHook = useAppointmentScheduling();
  
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
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !selectedLocal) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos antes de confirmar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a temporary reservation with pending payment status
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      
      // Use the reserve_appointment_slot function
      const { data: reservationData, error: reservationError } = await supabase.rpc('reserve_appointment_slot', {
        p_doctor_id: selectedDoctor,
        p_patient_id: user.id,
        p_family_member_id: selectedFamilyMember || null,
        p_scheduled_by_id: user.id,
        p_appointment_datetime: appointmentDateTime,
        p_specialty: selectedSpecialty
      });

      if (reservationError) {
        console.error('Reservation error:', reservationError);
        throw new Error(reservationError.message || "Erro ao reservar horário");
      }

      if (reservationData && reservationData.length > 0 && reservationData[0].success) {
        const consultaId = reservationData[0].appointment_id;
        
        // Process payment with Stripe
        const paymentResult = await processPayment({
          consultaId,
          medicoId: selectedDoctor,
          valor: 150, // Default consultation price - adjust as needed
          metodo: 'credit_card'
        });

        if (paymentResult.success) {
          toast({
            title: "Redirecionando para pagamento",
            description: "Você será redirecionado para completar o pagamento da consulta",
          });
        }
      } else {
        throw new Error(reservationData?.[0]?.message || "Horário não disponível");
      }
    } catch (error) {
      console.error('Error in appointment confirmation:', error);
      toast({
        title: "Erro ao processar agendamento",
        description: error instanceof Error ? error.message : "Tente novamente ou entre em contato com o suporte",
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
          />
        );
      case 5:
        return (
          <DateSelect
            doctorId={selectedDoctor}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
      case 6:
        return (
          <TimeSlotGrid
            selectedTime={selectedTime}
            timeSlots={locaisComHorarios?.flatMap(local => 
              local.horarios_disponiveis?.map(slot => ({ time: slot.time, available: slot.available })) || []
            ) || []}
            isLoading={isLoading}
            onChange={setSelectedTime}
          />
        );
      case 7:
        return (
          <div className="space-y-6">
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
              selectedLocal={selectedTime ? locaisComHorarios?.find(local => 
                local.horarios_disponiveis?.some(slot => slot.time === selectedTime)
              ) || locaisComHorarios?.[0] : null}
              selectedPatientName={selectedPatientName}
            />
            
            {/* Payment and Confirmation Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Finalizar Agendamento</h3>
                  <p className="text-sm text-green-600">Confirme os dados e proceda com o pagamento</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-sm font-medium text-gray-700">Valor da Consulta:</span>
                  <span className="text-lg font-bold text-green-700">R$ 150,00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">Forma de Pagamento:</span>
                  <span className="text-sm text-gray-600">Cartão de Crédito (via Stripe)</span>
                </div>
              </div>

              <Button
                onClick={handleAppointmentConfirm}
                disabled={processing || isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {processing || isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>CONFIRMAR E PAGAR</span>
                  </div>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                Ao confirmar, você será redirecionado para o pagamento seguro via Stripe
              </p>
            </div>
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