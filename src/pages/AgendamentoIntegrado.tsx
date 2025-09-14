/**
 * Sistema de Agendamento Integrado
 * Substitui o Agendamento.tsx com nova arquitetura
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

// Componentes inteligentes funcionais
import { IntelligentDoctorSearch } from '@/components/scheduling/IntelligentDoctorSearch';
import { IntelligentTimeSlots } from '@/components/scheduling/IntelligentTimeSlots';
import { AppointmentConfirmation } from '@/components/scheduling/AppointmentConfirmation';

// Serviços
import schedulingService, { Doctor, TimeSlot } from '@/services/scheduling';

type Step = 'search' | 'availability' | 'confirmation';

const AgendamentoIntegrado: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<Step>('search');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Buscar ID do paciente baseado no usuário logado
    const fetchPatientId = async () => {
      if (!user) return;
      
      try {
        // Aqui você buscaria o ID do paciente baseado no user.id
        // Por enquanto, vamos usar o user.id diretamente
        setPatientId(user.id);
      } catch (error) {
        console.error('Erro ao buscar dados do paciente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive"
        });
      }
    };

    fetchPatientId();
  }, [user]);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep('availability');
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    handleCreateAppointment(slot);
  };

  const handleCreateAppointment = async (slot: TimeSlot) => {
    if (!selectedDoctor || !patientId) return;

    setLoading(true);
    try {
      const result = await schedulingService.createAppointment({
        medico_id: selectedDoctor.id,
        paciente_id: patientId,
        consultation_date: slot.time,
        consultation_type: slot.type,
        local_id: slot.location_id,
        local_consulta_texto: ''
      });

      const appointmentIdResult = (result && (result as any)[0]?.appointment_id) || (result as any)?.appointment_id;
      if (appointmentIdResult) {
        setAppointmentId(appointmentIdResult);
        setCurrentStep('confirmation');
        toast({ title: "Consulta agendada!" });
      } else {
        toast({
          title: "Erro no agendamento",
          description: 'Não foi possível agendar a consulta',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast({
        title: "Erro no agendamento",
        description: "Não foi possível agendar a consulta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'availability':
        setCurrentStep('search');
        setSelectedDoctor(null);
        break;
      case 'confirmation':
        setCurrentStep('search');
        setSelectedDoctor(null);
        setAppointmentId(null);
        break;
      default:
        navigate('/dashboard-paciente');
    }
  };

  const handleNewAppointment = () => {
    setCurrentStep('search');
    setSelectedDoctor(null);
    setSelectedTimeSlot(null);
    setAppointmentId(null);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faça login para agendar consultas</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStepContent = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Processando agendamento inteligente...</p>
          </CardContent>
        </Card>
      );
    }

    switch (currentStep) {
      case 'search':
        return (
          <IntelligentDoctorSearch
            onSelectDoctor={handleDoctorSelect}
            patientId={patientId || undefined}
          />
        );
      
      case 'availability':
        return selectedDoctor ? (
          <IntelligentTimeSlots
            doctor={selectedDoctor}
            patientId={patientId || undefined}
            onSelectTime={handleTimeSlotSelect}
            onBack={() => setCurrentStep('search')}
          />
        ) : null;
      
      case 'confirmation':
        return appointmentId ? (
          <AppointmentConfirmation
            appointmentId={appointmentId}
            onNewAppointment={handleNewAppointment}
            onViewAppointments={() => navigate('/agenda-paciente')}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'search':
        return 'Busca Inteligente de Médicos';
      case 'availability':
        return 'Horários Otimizados com IA';
      case 'confirmation':
        return 'Consulta Agendada com Sucesso';
      default:
        return 'Agendamento Inteligente';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {currentStep !== 'search' && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getStepTitle()}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentStep === 'search' && 'IA analisa seu histórico e encontra os melhores médicos'}
                {currentStep === 'availability' && 'Horários otimizados considerando trânsito e disponibilidade'}
                {currentStep === 'confirmation' && 'Agendamento realizado com otimização inteligente'}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'search' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 ${
              currentStep !== 'search' ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'availability' ? 'bg-blue-500 text-white' : 
              currentStep === 'confirmation' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 ${
              currentStep === 'confirmation' ? 'bg-green-500' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'confirmation' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>
        </div>



        {/* Content */}
        {renderStepContent()}
      </div>
    </div>
  );
};

export default AgendamentoIntegrado;