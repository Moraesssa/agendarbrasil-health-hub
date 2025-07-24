import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { enhancedAppointmentService } from "@/services/enhancedAppointmentService";
import { newAppointmentService, LocalComHorarios } from "@/services/newAppointmentService";
import { TimeSlotGrid } from "./TimeSlotGrid";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  appointmentData: {
    medicoId: string;
    medicoNome: string;
    dataAtual: string;
    horaAtual: string;
    especialidade: string;
  };
  onSuccess?: () => void;
}

export const RescheduleDialog = ({
  open,
  onOpenChange,
  appointmentId,
  appointmentData,
  onSuccess
}: RescheduleDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedLocal, setSelectedLocal] = useState<LocalComHorarios | null>(null);
  const [reason, setReason] = useState("");
  const [locaisComHorarios, setLocaisComHorarios] = useState<LocalComHorarios[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { toast } = useToast();

  // Carregar horários disponíveis quando data for selecionada
  useEffect(() => {
    if (date && appointmentData.medicoId) {
      const loadAvailableSlots = async () => {
        setLoadingSlots(true);
        try {
          const slots = await newAppointmentService.getAvailableSlotsByDoctor(
            appointmentData.medicoId,
            format(date, 'yyyy-MM-dd')
          );
          setLocaisComHorarios(slots);
        } catch (error) {
          console.error("Erro ao carregar horários:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os horários disponíveis",
            variant: "destructive"
          });
        } finally {
          setLoadingSlots(false);
        }
      };

      loadAvailableSlots();
    }
  }, [date, appointmentData.medicoId, toast]);

  const handleReschedule = async () => {
    if (!date || !selectedTime || !selectedLocal) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma nova data e horário",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const newDateTime = `${format(date, 'yyyy-MM-dd')}T${selectedTime}:00`;
      
      const result = await enhancedAppointmentService.rescheduleAppointment(
        appointmentId,
        newDateTime,
        selectedLocal.id,
        reason || 'Reagendamento solicitado pelo paciente'
      );

      if (result.success) {
        toast({
          title: "Consulta reagendada!",
          description: "Sua consulta foi reagendada com sucesso",
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: "Erro ao reagendar",
          description: result.error || "Não foi possível reagendar a consulta",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Reagendar Consulta
          </DialogTitle>
          <DialogDescription>
            Dr(a). {appointmentData.medicoNome} - {appointmentData.especialidade}
            <br />
            <span className="text-muted-foreground text-xs">
              Horário atual: {format(new Date(appointmentData.dataAtual), "PPP", { locale: ptBR })} às {appointmentData.horaAtual}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nova data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecionar nova data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horários Disponíveis */}
          {date && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Horários disponíveis</label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : locaisComHorarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum horário disponível para esta data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {locaisComHorarios.map(local => (
                    <div key={local.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{local.nome_local}</h4>
                      <TimeSlotGrid
                        timeSlots={local.horarios_disponiveis}
                        selectedTime={selectedLocal?.id === local.id ? selectedTime : ""}
                        isLoading={false}
                        onChange={(time) => {
                          setSelectedTime(time);
                          setSelectedLocal(local);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Motivo do reagendamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo do reagendamento (opcional)</label>
            <Textarea
              placeholder="Ex: Conflito de horário, emergência, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Aviso importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Ao reagendar, sua consulta atual será cancelada 
              e uma nova será criada. Certifique-se de que a nova data e horário estão corretos.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={isLoading || !date || !selectedTime || !selectedLocal}
            className="flex-1"
          >
            {isLoading ? "Reagendando..." : "Confirmar Reagendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};