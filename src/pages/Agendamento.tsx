import React, { useState, useEffect, useMemo } from 'react';
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
import { NavigationHeader } from '@/components/scheduling/NavigationHeader';
import { EnhancedProgressIndicator } from '@/components/scheduling/EnhancedProgressIndicator';
import { ErrorBoundary } from '@/components/scheduling/ErrorBoundary';
import { LoadingSkeleton } from '@/components/scheduling/LoadingSkeleton';
import { SuccessAnimation, StepCompletion } from '@/components/scheduling/SuccessAnimation';
import { validateSchedulingStep } from '@/components/scheduling/FieldValidation';
import { SupabaseConfigWarning } from '@/components/SupabaseConfigWarning';
import { useAppointmentScheduling } from '@/hooks/useAppointmentScheduling';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { usePayment } from '@/hooks/usePayment';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getSupabaseConfig, checkSupabaseConnection } from '@/utils/supabaseCheck';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'react-router-dom';

const TOTAL_STEPS = 7;

const Agendamento = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState("");
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [showStepCompletion, setShowStepCompletion] = useState(false);
  const [completingStep, setCompletingStep] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { familyMembers } = useFamilyData();
  const { processPayment, processing } = usePayment();
  
  // Error handling hook
  const {
    handleError,
    handleNavigationError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    hasFieldError,
    isRetrying
  } = useErrorHandling({
    onError: (error) => {
      console.error('Agendamento error:', error);
    }
  });

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

  // Check-up preset support
  const [searchParams] = useSearchParams();
  const preset = searchParams.get('preset');
  const isCheckupPreset = preset === 'checkup';

  const checkupSuggestionsBase = ['Clínica Geral','Cardiologia','Ginecologia','Urologia'];
  const checkupSuggestions = useMemo(() => {
    const list = (specialties || []) as string[];
    return checkupSuggestionsBase.filter((s) => list.includes(s));
  }, [specialties]);

  const selectedPatientName = selectedFamilyMember 
    ? familyMembers?.find(member => member.id === selectedFamilyMember)?.display_name 
    : user?.user_metadata?.full_name || user?.email || "Usuário";

  // Verificar configuração do Supabase na inicialização
  useEffect(() => {
    const checkConfig = async () => {
      const config = getSupabaseConfig();
      if (!config.isConfigured) {
        setSupabaseConfigured(false);
        return;
      }

      const connectionCheck = await checkSupabaseConnection();
      if (!connectionCheck.connected) {
        setSupabaseConfigured(false);
        toast({
          title: "Erro de Conectividade",
          description: connectionCheck.error || "Não foi possível conectar ao banco de dados",
          variant: "destructive"
        });
      }
    };

    checkConfig();
  }, [toast]);

  const handleNext = async () => {
    try {
      // Clear previous errors
      clearAllErrors();
      
      // Validate current step
      const validationErrors = validateSchedulingStep(step, {
        selectedSpecialty,
        selectedState,
        selectedCity,
        selectedDoctor,
        selectedDate,
        selectedTime
      });

      if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
          setFieldError(error.field, error);
        });
        
        toast({
          title: "Campos obrigatórios",
          description: validationErrors[0].message,
          variant: "destructive"
        });
        return;
      }

      // Show step completion animation
      setCompletingStep(step);
      setShowStepCompletion(true);
      
      // Wait for animation
      setTimeout(() => {
        if (step < TOTAL_STEPS) {
          setStep(step + 1);
          setHasUnsavedChanges(false);
        }
        setShowStepCompletion(false);
        setCompletingStep(null);
      }, 1500);
      
    } catch (error) {
      handleNavigationError(step + 1, error as Error);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    
    // Encontrar o local correspondente ao horário selecionado
    if (locaisComHorarios && locaisComHorarios.length > 0) {
      const localComHorario = locaisComHorarios.find(local => 
        local.horarios_disponiveis?.some(slot => slot.time === time)
      );
      
      if (localComHorario) {
        appointmentHook.setters.setSelectedLocal(localComHorario);
      } else if (locaisComHorarios.length === 1) {
        // Se há apenas um local, selecionar automaticamente
        appointmentHook.setters.setSelectedLocal(locaisComHorarios[0]);
      }
    }
  };

  const handlePrevious = async () => {
    try {
      clearAllErrors();
      if (step > 1) {
        setStep(step - 1);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      handleNavigationError(step - 1, error as Error);
    }
  };

  const handleRestart = () => {
    setStep(1);
    resetSelection('state');
  };

  const handleStepClick = async (stepNumber: number) => {
    try {
      clearAllErrors();
      // Allow navigation to completed steps or current step
      if (stepNumber <= step) {
        setStep(stepNumber);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      handleNavigationError(stepNumber, error as Error);
    }
  };

  // Calculate completed steps based on current progress
  const getCompletedSteps = () => {
    const completed = [];
    if (selectedSpecialty && step > 1) completed.push(1);
    if (selectedState && step > 2) completed.push(2);
    if (selectedCity && step > 3) completed.push(3);
    if (selectedDoctor && step > 4) completed.push(4);
    if (selectedDate && step > 5) completed.push(5);
    if (selectedTime && step > 6) completed.push(6);
    if (step > 7) completed.push(7);
    return completed;
  };

  // Get error steps for progress indicator
  const getErrorSteps = () => {
    const errorSteps = [];
    if (hasFieldError('specialty')) errorSteps.push(1);
    if (hasFieldError('state')) errorSteps.push(2);
    if (hasFieldError('city')) errorSteps.push(3);
    if (hasFieldError('doctor')) errorSteps.push(4);
    if (hasFieldError('date')) errorSteps.push(5);
    if (hasFieldError('time')) errorSteps.push(6);
    return errorSteps;
  };

  // Track changes for unsaved changes indicator
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [selectedSpecialty, selectedState, selectedCity, selectedDoctor, selectedDate, selectedTime, selectedFamilyMember]);

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
        return isLoading && !specialties ? (
          <LoadingSkeleton variant="card" lines={3} />
        ) : (
          <>
            {isCheckupPreset && !selectedSpecialty && (
              <Alert className="mb-4 border-success/30 bg-success/5">
                <AlertTitle>Check-up preventivo</AlertTitle>
                <AlertDescription>
                  <p className="mb-3">Escolha uma especialidade para iniciar seu check-up:</p>
                  <div className="flex flex-wrap gap-2">
                    {checkupSuggestions.length > 0 ? (
                      checkupSuggestions.map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className="border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => setSelectedSpecialty(s)}
                        >
                          {s}
                        </Button>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Use o seletor abaixo para escolher a especialidade.</span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <SpecialtySelect
              selectedSpecialty={selectedSpecialty}
              specialties={specialties}
              isLoading={isLoading}
              onChange={(value) => {
                setSelectedSpecialty(value);
                clearFieldError('specialty');
              }}
              disabled={isLoading}
            />
          </>
        );
      case 2:
        return isLoading && !states ? (
          <LoadingSkeleton variant="card" lines={3} />
        ) : (
          <StateSelect
            selectedState={selectedState}
            states={states}
            isLoading={isLoading}
            onChange={(value) => {
              setSelectedState(value);
              clearFieldError('state');
            }}
          />
        );
      case 3:
        return isLoading && !cities ? (
          <LoadingSkeleton variant="card" lines={3} />
        ) : (
          <CitySelect
            selectedCity={selectedCity}
            cities={cities}
            isLoading={isLoading}
            onChange={(value) => {
              setSelectedCity(value);
              clearFieldError('city');
            }}
          />
        );
      case 4:
        return isLoading && !doctors ? (
          <LoadingSkeleton variant="card" lines={3} />
        ) : (
          <DoctorSelect
            selectedDoctor={selectedDoctor}
            doctors={doctors}
            isLoading={isLoading}
            onChange={(value) => {
              setSelectedDoctor(value);
              clearFieldError('doctor');
            }}
          />
        );
      case 5:
        return isLoading ? (
          <LoadingSkeleton variant="card" lines={4} />
        ) : (
          <DateSelect
            doctorId={selectedDoctor}
            selectedDate={selectedDate}
            onDateSelect={(value) => {
              setSelectedDate(value);
              clearFieldError('date');
            }}
          />
        );
      case 6:
        // Processar horários removendo duplicatas e agrupando por horário
        const processedTimeSlots = new Map<string, { time: string; available: boolean; locations: string[] }>();
        
        locaisComHorarios?.forEach(local => {
          (local.horarios_disponiveis || []).forEach(slot => {
            const existing = processedTimeSlots.get(slot.time);
            if (existing) {
              // Se já existe, adiciona o local e mantém disponibilidade se pelo menos um estiver disponível
              existing.available = existing.available || slot.available;
              existing.locations.push(local.nome_local);
            } else {
              // Novo horário
              processedTimeSlots.set(slot.time, {
                time: slot.time,
                available: slot.available,
                locations: [local.nome_local]
              });
            }
          });
        });
        
        // Converter para array e ordenar por horário
        const timeSlots = Array.from(processedTimeSlots.values())
          .map(slot => ({ time: slot.time, available: slot.available }))
          .sort((a, b) => a.time.localeCompare(b.time));
        
        return (
          <div>
            {isLoading && timeSlots.length === 0 ? (
              <LoadingSkeleton variant="grid" lines={8} />
            ) : (
              <TimeSlotGrid
                selectedTime={selectedTime}
                timeSlots={timeSlots}
                isLoading={isLoading}
                locaisInfo={locaisComHorarios}
                onChange={(value) => {
                  handleTimeSelect(value);
                  clearFieldError('time');
                }}
              />
            )}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-bold text-sm text-yellow-800 mb-2">🐛 Debug Info</h4>
                <div className="text-xs text-yellow-700">
                  <p><strong>Locais com horários:</strong> {locaisComHorarios?.length || 0}</p>
                  <p><strong>Total de slots:</strong> {timeSlots.length}</p>
                  <p><strong>Médico selecionado:</strong> {selectedDoctor}</p>
                  <p><strong>Data selecionada:</strong> {selectedDate}</p>
                  {locaisComHorarios && locaisComHorarios.length > 0 && (
                    <div className="mt-2">
                      <p><strong>Detalhes dos locais:</strong></p>
                      {locaisComHorarios.map((local, index) => (
                        <div key={local.id} className="ml-2">
                          <p>• {local.nome_local}: {local.horarios_disponiveis?.length || 0} horários</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            {/* Family Member Selection - Now prominently displayed first */}
            <FamilyMemberSelect
              selectedMemberId={selectedFamilyMember}
              onChange={(value) => {
                setSelectedFamilyMember(value);
                clearFieldError('familyMember');
              }}
              familyMembers={familyMembers || []}
              currentUserId={user?.id || ""}
              currentUserName={user?.user_metadata?.full_name || user?.email || "Você"}
              isLoading={isLoading}
              error={getFieldError('familyMember')}
              showSuccess={!!selectedFamilyMember}
            />
            
            {/* Appointment Summary */}
            <AppointmentSummary
              selectedSpecialty={selectedSpecialty}
              selectedDoctorName={doctors?.find(d => d.id === selectedDoctor)?.display_name || selectedDoctor}
              selectedState={selectedState}
              selectedCity={selectedCity}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedLocal={selectedTime && locaisComHorarios && locaisComHorarios.length > 0 ? 
                locaisComHorarios.find(local => 
                  local.horarios_disponiveis?.some(slot => slot.time === selectedTime)
                ) || locaisComHorarios[0] : null}
              selectedPatientName={selectedPatientName}
            />
            
            {/* Payment and Confirmation Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start sm:items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-green-800 text-base sm:text-lg">Finalizar Agendamento</h3>
                  <p className="text-xs sm:text-sm text-green-600 leading-tight">
                    Confirme os dados e proceda com o pagamento
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Valor da Consulta:</span>
                  <span className="text-base sm:text-lg font-bold text-green-700">R$ 150,00</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Forma de Pagamento:</span>
                  <span className="text-xs sm:text-sm text-gray-600">Cartão de Crédito (via Stripe)</span>
                </div>
              </div>

              <Button
                onClick={handleAppointmentConfirm}
                disabled={processing || isSubmitting || isRetrying}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                aria-label="Confirmar agendamento e prosseguir para pagamento"
                aria-describedby="payment-info"
              >
                {processing || isSubmitting || isRetrying ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    ></div>
                    <span className="text-sm sm:text-base">
                      {isRetrying ? 'Tentando novamente...' : 'Processando...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg 
                      className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm sm:text-base">CONFIRMAR E PAGAR</span>
                  </div>
                )}
              </Button>
              
              <p 
                id="payment-info"
                className="text-xs text-gray-500 mt-3 text-center leading-tight px-2"
              >
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
    <ErrorBoundary>
      {/* Skip link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={(e) => e.target.scrollIntoView()}
      >
        Pular para o conteúdo principal
      </a>
      
      {/* Step Completion Animation */}
      {showStepCompletion && completingStep && (
        <StepCompletion
          stepNumber={completingStep}
          stepTitle={stepTitles[completingStep - 1]}
          show={showStepCompletion}
          onComplete={() => {
            setShowStepCompletion(false);
            setCompletingStep(null);
          }}
        />
      )}

      {/* Navigation Header */}
      <NavigationHeader
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBackClick={handlePrevious}
        canGoBack={step > 1}
        isLoading={isLoading || isSubmitting || processing}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      {/* Main Content with top padding to account for fixed header */}
      <main 
        id="main-content"
        className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl mt-14 sm:mt-16"
        role="main"
        aria-labelledby="agendamento-title"
      >
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle 
              id="agendamento-title"
              className="text-xl sm:text-2xl font-bold text-center"
            >
              Agendar Consulta
            </CardTitle>
            
            {/* Enhanced Progress Indicator */}
            <div className="mt-4 sm:mt-6">
              <EnhancedProgressIndicator
                currentStep={step}
                totalSteps={TOTAL_STEPS}
                stepTitles={stepTitles}
                completedSteps={getCompletedSteps()}
                onStepClick={handleStepClick}
                errorSteps={getErrorSteps()}
                loadingStep={completingStep || undefined}
              />
            </div>
            
            {/* Fallback simple progress for accessibility */}
            <div className="sr-only">
              <div className="text-center text-xs sm:text-sm text-muted-foreground">
                Passo {step} de {TOTAL_STEPS}: {stepTitles[step - 1]}
              </div>
              <Progress 
                value={progress} 
                className="w-full h-2 sm:h-3"
                aria-label={`Progresso do agendamento: ${Math.round(progress)}% concluído`}
              />
            </div>
          </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <SupabaseConfigWarning show={!supabaseConfigured} />
          
          {/* Step content with proper region labeling */}
          <section 
            aria-labelledby={`step-${step}-heading`}
            aria-describedby={`step-${step}-description`}
            role="region"
          >
            <div className="sr-only">
              <h2 id={`step-${step}-heading`}>
                Etapa {step}: {stepTitles[step - 1]}
              </h2>
              <p id={`step-${step}-description`}>
                Complete esta etapa para continuar com o agendamento
              </p>
            </div>
            {renderStep()}
          </section>
          
          <nav className="flex justify-between pt-4 sm:pt-6 gap-3" aria-label="Navegação entre etapas">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={isLoading || isSubmitting || showStepCompletion}
                className={`btn-enhanced-hover focus-ring touch-manipulation h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none`}
                aria-label={`Voltar para a etapa anterior: ${step > 1 ? stepTitles[step - 2] : ''}`}
              >
                {isLoading || isSubmitting || showStepCompletion ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                    <span className="hidden xs:inline">Aguarde...</span>
                  </div>
                ) : (
                  <>
                    <span className="hidden xs:inline">Anterior</span>
                    <span className="xs:hidden" aria-hidden="true">←</span>
                  </>
                )}
              </Button>
            )}
            
            {step < TOTAL_STEPS && (
              <Button 
                onClick={handleNext} 
                className={`ml-auto btn-enhanced-hover focus-ring touch-manipulation h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none`}
                disabled={
                  isLoading || 
                  showStepCompletion ||
                  (step === 1 && !selectedSpecialty) ||
                  (step === 2 && !selectedState) ||
                  (step === 3 && !selectedCity) ||
                  (step === 4 && !selectedDoctor) ||
                  (step === 5 && !selectedDate) ||
                  (step === 6 && !selectedTime)
                }
                aria-label={`Avançar para a próxima etapa: ${step < TOTAL_STEPS ? stepTitles[step] : ''}`}
              >
                {isLoading || showStepCompletion ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                    <span className="hidden xs:inline">
                      {showStepCompletion ? 'Concluindo...' : 'Carregando...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="hidden xs:inline">Próximo</span>
                    <span className="xs:hidden" aria-hidden="true">→</span>
                  </>
                )}
              </Button>
            )}
          </nav>
        </CardContent>
      </Card>
    </main>
    </ErrorBoundary>
  );
};

export default Agendamento;