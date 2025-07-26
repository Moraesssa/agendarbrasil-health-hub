
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { enhancedAppointmentService } from "@/services/enhancedAppointmentService";

interface WaitingListDialogProps {
  medicoId: string;
  medicoNome: string;
  especialidade: string;
  localId?: string;
  trigger?: React.ReactNode;
}

export const WaitingListDialog = ({
  medicoId,
  medicoNome,
  especialidade,
  localId,
  trigger
}: WaitingListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [periodo, setPeriodo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddToWaitingList = async () => {
    if (!date || !periodo) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma data e período de preferência",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await enhancedAppointmentService.addToWaitingList(
        medicoId,
        format(date, 'yyyy-MM-dd'),
        periodo as 'manha' | 'tarde' | 'noite' | 'qualquer',
        especialidade
      );

      if (result.success) {
        toast({
          title: "Adicionado à lista de espera!",
          description: "Você será notificado quando houver disponibilidade",
        });
        setOpen(false);
        setDate(undefined);
        setPeriodo("");
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível adicionar à lista de espera",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lista de Espera
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lista de Espera
          </DialogTitle>
          <DialogDescription>
            Seja notificado quando houver disponibilidade com {medicoNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Data de preferência</label>
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
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecionar data"}
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Período de preferência</label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualquer">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Qualquer horário
                  </div>
                </SelectItem>
                <SelectItem value="manha">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Manhã (06:00 - 12:00)
                  </div>
                </SelectItem>
                <SelectItem value="tarde">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tarde (12:00 - 18:00)
                  </div>
                </SelectItem>
                <SelectItem value="noite">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Noite (18:00 - 22:00)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Como funciona:</strong> Quando um horário for cancelado ou liberado 
              na sua data de preferência, você receberá uma notificação por email e terá 
              prioridade para agendar.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddToWaitingList}
            disabled={isLoading || !date || !periodo}
            className="flex-1"
          >
            {isLoading ? "Adicionando..." : "Adicionar à Lista"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
