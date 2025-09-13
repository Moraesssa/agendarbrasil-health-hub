import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, MapPin, DollarSign, User, Calendar } from 'lucide-react';
import { SearchDoctors } from './SearchDoctors';
import { SelectTimeSlot } from './SelectTimeSlot';
import { SchedulingService, Doctor, AvailableSlot } from '@/services/schedulingService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type BookingStep = 'search' | 'schedule' | 'confirm' | 'success';

interface PatientData {
  nome: string;
  email: string;
  telefone: string;
  motivo_consulta: string;
}

export function AppointmentBooking() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('search');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [patientData, setPatientData] = useState<PatientData>({
    nome: '',
    email: '',
    telefone: '',
    motivo_consulta: ''
  });
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep('schedule');
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot) return;

    setLoading(true);
    try {
      // Primeiro, criar/buscar paciente
      const { data: existingPatient } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', '00000000-0000-0000-0000-000000000000') // Use user_id instead of email
        .single();

      let pacienteId = existingPatient?.id;

      if (!pacienteId) {
        // Criar novo paciente
        const { data: newPatient, error: patientError } = await supabase
          .from('pacientes')
          .insert([{
            user_id: '00000000-0000-0000-0000-000000000000', // Usuário temporário
            nome: patientData.nome,
            email: patientData.email,
            telefone: patientData.telefone,
            data_nascimento: '1990-01-01', // Data temporária
            ativo: true
          }])
          .select('id')
          .single();

        if (patientError) throw patientError;
        pacienteId = newPatient.id;
      }

      // Agendar consulta
      const appointment = await SchedulingService.scheduleAppointment({
        medico_id: selectedDoctor.id,
        paciente_id: String(pacienteId), // Convert to string
        local_id: selectedSlot.local_id,
        data_hora_agendada: selectedSlot.data_hora,
        duracao_estimada: selectedSlot.duracao_disponivel,
        tipo: selectedSlot.tipo_consulta,
        valor_consulta: selectedSlot.valor,
        motivo_consulta: patientData.motivo_consulta,
        agendado_por: String(pacienteId) // Convert to string
      });

      setAppointmentId(appointment.id);
      setCurrentStep('success');
      toast.success('Consulta agendada com sucesso!');
    } catch (error) {
      toast.error('Erro ao agendar consulta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const resetBooking = () => {
    setCurrentStep('search');
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setPatientData({
      nome: '',
      email: '',
      telefone: '',
      motivo_consulta: ''
    });
    setAppointmentId(null);
  };

  // Renderizar etapas
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center ${currentStep === 'search' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep === 'search' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          }`}>
            1
          </div>
          <span className="ml-2">Buscar Médico</span>
        </div>
        
        <Separator className="w-8" />
        
        <div className={`flex items-center ${currentStep === 'schedule' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep === 'schedule' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          }`}>
            2
          </div>
          <span className="ml-2">Escolher Horário</span>
        </div>
        
        <Separator className="w-8" />
        
        <div className={`flex items-center ${currentStep === 'confirm' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep === 'confirm' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          }`}>
            3
          </div>
          <span className="ml-2">Confirmar</span>
        </div>
        
        <Separator className="w-8" />
        
        <div className={`flex items-center ${currentStep === 'success' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep === 'success' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          }`}>
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="ml-2">Concluído</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Agendar Consulta</h1>
        <p className="text-muted-foreground text-center">
          Encontre o médico ideal e agende sua consulta em poucos passos
        </p>
      </div>

      {renderStepIndicator()}

      {/* Etapa 1: Buscar Médicos */}
      {currentStep === 'search' && (
        <SearchDoctors onSelectDoctor={handleSelectDoctor} />
      )}

      {/* Etapa 2: Selecionar Horário */}
      {currentStep === 'schedule' && selectedDoctor && (
        <SelectTimeSlot
          doctor={selectedDoctor}
          onSelectSlot={handleSelectSlot}
          onBack={() => setCurrentStep('search')}
        />
      )}

      {/* Etapa 3: Confirmar Agendamento */}
      {currentStep === 'confirm' && selectedDoctor && selectedSlot && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confirmar Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resumo da Consulta */}
                <div>
                  <h3 className="font-semibold mb-4">Resumo da Consulta</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{selectedDoctor.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedDoctor.especialidade}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(selectedSlot.data_hora)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{selectedSlot.duracao_disponivel} minutos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>R$ {selectedSlot.valor.toFixed(2)}</span>
                    </div>
                    {selectedSlot.local_id ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Consulta Presencial</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Teleconsulta</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dados do Paciente */}
                <div>
                  <h3 className="font-semibold mb-4">Seus Dados</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome Completo</label>
                      <Input
                        value={patientData.nome}
                        onChange={(e) => setPatientData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={patientData.email}
                        onChange={(e) => setPatientData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input
                        value={patientData.telefone}
                        onChange={(e) => setPatientData(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Motivo da Consulta</label>
                      <Textarea
                        value={patientData.motivo_consulta}
                        onChange={(e) => setPatientData(prev => ({ ...prev, motivo_consulta: e.target.value }))}
                        placeholder="Descreva brevemente o motivo da consulta"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('schedule')}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={loading || !patientData.nome || !patientData.email}
                  className="flex-1"
                >
                  {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Etapa 4: Sucesso */}
      {currentStep === 'success' && selectedDoctor && selectedSlot && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Consulta Agendada com Sucesso!</h2>
            <p className="text-muted-foreground mb-6">
              Sua consulta foi agendada. Você receberá um email de confirmação em breve.
            </p>
            
            <div className="bg-muted p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Detalhes da Consulta</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Médico:</strong> {selectedDoctor.nome}</p>
                <p><strong>Data e Hora:</strong> {formatDateTime(selectedSlot.data_hora)}</p>
                <p><strong>Tipo:</strong> {selectedSlot.tipo_consulta === 'presencial' ? 'Presencial' : 'Teleconsulta'}</p>
                <p><strong>Valor:</strong> R$ {selectedSlot.valor.toFixed(2)}</p>
                {appointmentId && <p><strong>Código:</strong> {appointmentId}</p>}
              </div>
            </div>

            <Button onClick={resetBooking}>
              Agendar Nova Consulta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}