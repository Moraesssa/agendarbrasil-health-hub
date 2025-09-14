/**
 * Componente de Disponibilidade do Médico
 * Mostra horários disponíveis e permite agendamento
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

import schedulingService from '@/services/scheduling';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface Doctor {
  id: string;
  nome: string;
  valor_consulta_presencial?: number;
  valor_consulta_teleconsulta?: number;
}

interface AvailableSlot {
  consultation_date: string;
  duracao_disponivel: number;
  local_id?: string;
  consultation_type: 'presencial' | 'teleconsulta';
  valor: number;
}

interface DoctorAvailabilityProps {
  doctor: Doctor;
  patientId?: string;
  onBack: () => void;
  onAppointmentCreated?: (appointmentId: string) => void;
}

export const DoctorAvailability: React.FC<DoctorAvailabilityProps> = ({
  doctor,
  patientId,
  onBack,
  onAppointmentCreated
}) => {
  const { user } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [consultationType, setConsultationType] = useState<'presencial' | 'teleconsulta'>('presencial');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Formulário de agendamento
  const [bookingData, setBookingData] = useState({
    motivo_consulta: '',
    observacoes_paciente: '',
    prioridade: 'normal' as 'baixa' | 'normal' | 'alta' | 'emergencia'
  });

  useEffect(() => {
    loadAvailability();
  }, [currentWeek, consultationType]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      
      const startOfWeek = new Date(currentWeek);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const slots: AvailableSlot[] = [];
      const day = new Date(startOfWeek);
      while (day <= endOfWeek) {
        const dateStr = day.toISOString().split('T')[0];
        const locations = await schedulingService.getAvailableSlots(doctor.id, dateStr);
        locations.forEach(loc => {
          (loc.horarios_disponiveis || []).forEach(h => {
            slots.push({
              consultation_date: `${dateStr}T${h}`,
              duracao_disponivel: 30,
              local_id: loc.id,
              consultation_type: consultationType,
              valor: consultationType === 'teleconsulta'
                ? doctor.valor_consulta_teleconsulta || 0
                : doctor.valor_consulta_presencial || 0
            });
          });
        });
        day.setDate(day.getDate() + 1);
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a disponibilidade do médico.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !user || !patientId) return;

    try {
      setLoading(true);

      const result = await schedulingService.createAppointment({
        medico_id: doctor.id,
        paciente_id: patientId,
        consultation_date: selectedSlot.consultation_date,
        consultation_type: selectedSlot.consultation_type,
        local_id: selectedSlot.local_id,
        local_consulta_texto: '',
        notes: bookingData.motivo_consulta,
      });

      toast({
        title: "Sucesso!",
        description: "Consulta agendada com sucesso.",
      });

      const appointmentId = (result && (result as any)[0]?.appointment_id) || (result as any)?.appointment_id;
      if (appointmentId) {
        onAppointmentCreated?.(appointmentId);
      }
      
    } catch (error: any) {
      console.error('Erro ao agendar:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível agendar a consulta.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const groupSlotsByDay = (slots: AvailableSlot[]) => {
    const grouped: { [key: string]: AvailableSlot[] } = {};

    slots.forEach(slot => {
      const date = new Date(slot.consultation_date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });

    return grouped;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (showBookingForm && selectedSlot) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowBookingForm(false)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Confirmar Agendamento</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo da consulta */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={doctor.foto_perfil_url} />
                <AvatarFallback>
                  {doctor.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{doctor.nome}</h3>
                <p className="text-sm text-muted-foreground">{doctor.especialidade}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium">Data e Horário</p>
                <p className="text-sm">{formatDate(selectedSlot.consultation_date)} às {formatTime(selectedSlot.consultation_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Tipo</p>
                <div className="flex items-center gap-1">
                  {selectedSlot.consultation_type === 'teleconsulta' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  <span className="text-sm capitalize">{selectedSlot.consultation_type}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Duração</p>
                <p className="text-sm">{selectedSlot.duracao_disponivel} minutos</p>
              </div>
              <div>
                <p className="text-sm font-medium">Valor</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedSlot.valor)}</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da consulta *</label>
              <Textarea
                placeholder="Descreva brevemente o motivo da consulta..."
                value={bookingData.motivo_consulta}
                onChange={(e) => setBookingData(prev => ({ ...prev, motivo_consulta: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Observações adicionais</label>
              <Textarea
                placeholder="Informações adicionais que o médico deve saber..."
                value={bookingData.observacoes_paciente}
                onChange={(e) => setBookingData(prev => ({ ...prev, observacoes_paciente: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <Select 
                value={bookingData.prioridade} 
                onValueChange={(value: any) => setBookingData(prev => ({ ...prev, prioridade: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="emergencia">Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowBookingForm(false)}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button 
              onClick={handleBooking}
              disabled={loading || !bookingData.motivo_consulta.trim()}
              className="flex-1"
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar Agendamento
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedSlots = groupSlotsByDay(availableSlots);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="w-12 h-12">
                <AvatarImage src={doctor.foto_perfil_url} />
                <AvatarFallback>
                  {doctor.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{doctor.nome}</h2>
                <p className="text-muted-foreground">{doctor.especialidade}</p>
                <div className="flex items-center gap-1 mt-1">
                  {renderStars(doctor.rating)}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({doctor.total_avaliacoes} avaliações)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Seletor de tipo de consulta */}
          <div className="flex gap-2 mb-4">
            {doctor.aceita_consulta_presencial && (
              <Button
                variant={consultationType === 'presencial' ? 'default' : 'outline'}
                onClick={() => setConsultationType('presencial')}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Presencial - {formatCurrency(doctor.valor_consulta_presencial || 0)}
              </Button>
            )}
            {doctor.aceita_teleconsulta && (
              <Button
                variant={consultationType === 'teleconsulta' ? 'default' : 'outline'}
                onClick={() => setConsultationType('teleconsulta')}
                className="flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Teleconsulta - {formatCurrency(doctor.valor_consulta_teleconsulta || 0)}
              </Button>
            )}
          </div>

          {/* Navegação de semana */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
              Semana Anterior
            </Button>
            <h3 className="font-medium">
              {currentWeek.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              Próxima Semana
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Horários disponíveis */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando disponibilidade...</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedSlots).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum horário disponível nesta semana.</p>
            <p className="text-sm text-gray-500 mt-2">
              Tente navegar para outra semana ou alterar o tipo de consulta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(groupedSlots).map(([date, slots]) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {new Date(date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {slots.map((slot, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSlotSelect(slot)}
                      className="w-full justify-start text-left"
                    >
                      <Clock className="w-3 h-3 mr-2" />
                      {formatTime(slot.consultation_date)}
                      <span className="ml-auto text-xs">
                        {slot.duracao_disponivel}min
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;