/**
 * Seleção Inteligente de Horários
 * Componente funcional com IA para otimizar horários
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Clock, 
  MapPin, 
  Video, 
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar as CalendarIcon,
  Star
} from 'lucide-react';
import intelligentSchedulingService, { Doctor, TimeSlot } from '@/services/intelligentSchedulingService';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntelligentTimeSlotsProps {
  doctor: Doctor;
  patientId?: string;
  onSelectTime: (slot: TimeSlot) => void;
  onBack: () => void;
}

export const IntelligentTimeSlots: React.FC<IntelligentTimeSlotsProps> = ({
  doctor,
  patientId,
  onSelectTime,
  onBack
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [consultationType, setConsultationType] = useState<'presencial' | 'teleconsulta'>('presencial');

  // Carregar horários quando data ou tipo muda
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate, consultationType]);

  // Definir tipo padrão baseado no que o médico aceita
  useEffect(() => {
    if (doctor.aceita_teleconsulta && !doctor.aceita_consulta_presencial) {
      setConsultationType('teleconsulta');
    } else if (!doctor.aceita_teleconsulta && doctor.aceita_consulta_presencial) {
      setConsultationType('presencial');
    }
  }, [doctor]);

  const loadTimeSlots = async () => {
    setLoading(true);
    try {
      const slots = await intelligentSchedulingService.getIntelligentTimeSlots({
        doctor_id: doctor.id,
        date: selectedDate.toISOString().split('T')[0],
        consultation_type: consultationType,
        patient_id: patientId
      });

      setTimeSlots(slots);

      if (slots.length === 0) {
        toast({
          title: "Nenhum horário disponível",
          description: "Tente outra data ou tipo de consulta",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast({
        title: "Erro ao carregar horários",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 0.5) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.7) return <Star className="w-4 h-4" />;
    if (confidence >= 0.5) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getTrafficInfo = (slot: TimeSlot) => {
    if (slot.type === 'teleconsulta' || !slot.traffic_factor) return null;
    
    if (slot.traffic_factor <= 1.0) {
      return { text: 'Trânsito tranquilo', color: 'text-green-600' };
    } else if (slot.traffic_factor <= 1.3) {
      return { text: 'Trânsito moderado', color: 'text-orange-600' };
    } else {
      return { text: 'Trânsito intenso', color: 'text-red-600' };
    }
  };

  // Agrupar slots por período do dia
  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const periods = {
      morning: { label: 'Manhã', slots: [] as TimeSlot[] },
      afternoon: { label: 'Tarde', slots: [] as TimeSlot[] },
      evening: { label: 'Noite', slots: [] as TimeSlot[] }
    };

    slots.forEach(slot => {
      const hour = new Date(slot.time).getHours();
      if (hour < 12) {
        periods.morning.slots.push(slot);
      } else if (hour < 18) {
        periods.afternoon.slots.push(slot);
      } else {
        periods.evening.slots.push(slot);
      }
    });

    return periods;
  };

  const renderTimeSlot = (slot: TimeSlot) => {
    const trafficInfo = getTrafficInfo(slot);
    const confidenceClass = getConfidenceColor(slot.confidence_score);
    const confidenceIcon = getConfidenceIcon(slot.confidence_score);

    return (
      <Button
        key={slot.time}
        variant="outline"
        className={`p-4 h-auto flex flex-col items-start gap-2 hover:shadow-md transition-all ${confidenceClass}`}
        onClick={() => onSelectTime(slot)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {slot.type === 'teleconsulta' ? (
              <Video className="w-4 h-4" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span className="font-medium">{formatTime(slot.time)}</span>
          </div>
          {confidenceIcon}
        </div>
        
        <div className="text-xs text-left w-full space-y-1">
          <div>Duração: {slot.estimated_duration}min</div>
          <div>Confiança: {Math.round(slot.confidence_score * 100)}%</div>
          {trafficInfo && (
            <div className={trafficInfo.color}>{trafficInfo.text}</div>
          )}
        </div>
      </Button>
    );
  };

  const renderSlotsByPeriod = () => {
    const periods = groupSlotsByPeriod(timeSlots);
    
    return (
      <div className="space-y-6">
        {Object.entries(periods).map(([key, period]) => {
          if (period.slots.length === 0) return null;
          
          return (
            <div key={key}>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {period.label} ({period.slots.length} horários)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {period.slots.map(renderTimeSlot)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com informações do médico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Horários Inteligentes - Dr(a). {doctor.nome}
              </CardTitle>
              <p className="text-gray-600">{doctor.especialidade}</p>
            </div>
            <Button variant="outline" onClick={onBack}>
              Voltar
            </Button>
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
                Presencial - {formatPrice(doctor.valor_consulta_presencial)}
              </Button>
            )}
            {doctor.aceita_teleconsulta && (
              <Button
                variant={consultationType === 'teleconsulta' ? 'default' : 'outline'}
                onClick={() => setConsultationType('teleconsulta')}
                className="flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Teleconsulta - {formatPrice(doctor.valor_consulta_teleconsulta)}
              </Button>
            )}
          </div>

          {/* Informações sobre IA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Otimização Inteligente Ativa</p>
                <p className="text-blue-600">
                  Horários ordenados por disponibilidade, trânsito e seu histórico médico
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de data e horários */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Selecionar Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
              locale={ptBR}
              className="rounded-md border"
            />
            <div className="mt-4 text-sm text-gray-600">
              <p>Data selecionada:</p>
              <p className="font-medium">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Horários disponíveis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horários Disponíveis
            </CardTitle>
            <p className="text-sm text-gray-600">
              {consultationType === 'teleconsulta' ? 'Consulta online' : 'Consulta presencial'}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2">Carregando horários inteligentes...</span>
              </div>
            ) : timeSlots.length > 0 ? (
              renderSlotsByPeriod()
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum horário disponível</h3>
                <p className="text-gray-600 mb-4">
                  Não há horários disponíveis para esta data e tipo de consulta
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  >
                    Próximo dia
                  </Button>
                  {doctor.aceita_teleconsulta && doctor.aceita_consulta_presencial && (
                    <Button
                      variant="outline"
                      onClick={() => setConsultationType(
                        consultationType === 'presencial' ? 'teleconsulta' : 'presencial'
                      )}
                    >
                      Trocar para {consultationType === 'presencial' ? 'teleconsulta' : 'presencial'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legenda */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Legenda dos Indicadores Inteligentes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Alta confiança (90%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />
              <span>Boa confiança (70-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Confiança moderada (50-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Baixa confiança (&lt;50%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentTimeSlots;