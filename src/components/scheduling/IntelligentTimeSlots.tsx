/**
 * Seleção de Horários utilizando serviço unificado
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, ArrowLeft } from 'lucide-react';
import schedulingService, { Doctor, LocalComHorarios, TimeSlot } from '@/services/scheduling';
import { useToast } from '@/hooks/use-toast';
import { ptBR } from 'date-fns/locale';

interface IntelligentTimeSlotsProps {
  doctor: Doctor;
  patientId?: string;
  onSelectTime: (slot: TimeSlot) => void;
  onBack: () => void;
}

export const IntelligentTimeSlots: React.FC<IntelligentTimeSlotsProps> = ({
  doctor,
  onSelectTime,
  onBack
}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSlots();
  }, [selectedDate, doctor.id]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const locations = await schedulingService.getAvailableSlots(doctor.id, dateStr);
      const allSlots: TimeSlot[] = [];
      locations.forEach((loc: LocalComHorarios) => {
        (loc.horarios_disponiveis || []).forEach((h) => {
          allSlots.push({
            time: `${dateStr}T${h}`,
            type: 'presencial',
            location_id: loc.id,
            estimated_duration: 30,
            confidence_score: 1
          });
        });
      });
      setSlots(allSlots);
    } catch (error) {
      toast({ title: 'Erro ao carregar horários', variant: 'destructive' });
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <CardTitle>Horários Disponíveis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar mode="single" selected={selectedDate} onSelect={d=>d && setSelectedDate(d)} locale={ptBR} />
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Nenhum horário disponível</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {slots.map(slot => (
              <Button key={slot.time} variant="outline" onClick={()=>onSelectTime(slot)}>
                {formatTime(slot.time)}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligentTimeSlots;
