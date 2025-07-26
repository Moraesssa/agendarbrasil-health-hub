
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { enhancedAppointmentService } from '@/services/enhancedAppointmentService';

interface RescheduleDialogProps {
  appointmentId: string;
  currentDateTime: string;
  onReschedule?: () => void;
  children: React.ReactNode;
}

export const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  appointmentId,
  currentDateTime,
  onReschedule,
  children
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Selecione uma data e horário");
      return;
    }

    setLoading(true);
    try {
      const newDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      newDateTime.setHours(parseInt(hours), parseInt(minutes));

      const result = await enhancedAppointmentService.rescheduleAppointment(
        appointmentId,
        newDateTime.toISOString()
      );

      if (result.success) {
        toast.success("Consulta reagendada com sucesso!");
        setIsOpen(false);
        onReschedule?.();
      } else {
        toast.error(result.error || "Erro ao reagendar consulta");
      }
    } catch (error) {
      console.error('Erro ao reagendar:', error);
      toast.error("Erro ao reagendar consulta");
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar Consulta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Data atual:</label>
            <p className="text-sm text-gray-600">
              {new Date(currentDateTime).toLocaleString('pt-BR')}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Nova data:</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {selectedDate && (
            <div>
              <label className="text-sm font-medium mb-2 block">Horário:</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || loading}
            >
              {loading ? "Reagendando..." : "Reagendar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
