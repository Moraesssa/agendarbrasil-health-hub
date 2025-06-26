import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotGridProps {
  timeSlots: TimeSlot[];
  selectedTime: string;
  isLoading: boolean;
  onChange: (time: string) => void;
  disabled?: boolean;
}

export function TimeSlotGrid({ timeSlots, selectedTime, isLoading, onChange, disabled = false }: TimeSlotGridProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="time-slots">Horário</Label>
      <div id="time-slots" className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {isLoading && (
          <div className="col-span-full flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Carregando horários...</span>
          </div>
        )}

        {!isLoading && !disabled && timeSlots.length === 0 && (
           <p className="col-span-full p-4 text-sm text-center text-gray-500 bg-gray-50 rounded-md">
             Nenhum horário disponível para esta data. Por favor, selecione outro dia.
           </p>
        )}

        {timeSlots.map((slot) => (
          <Button
            key={slot.time}
            variant={selectedTime === slot.time ? "default" : "outline"}
            onClick={() => onChange(slot.time)}
            disabled={disabled || !slot.available}
            className={cn(
                "flex items-center justify-center gap-1",
                !slot.available && "text-muted-foreground line-through bg-gray-100",
                selectedTime === slot.time && "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-500 ring-offset-2"
            )}
          >
            <Clock className="h-4 w-4" />
            {slot.time}
          </Button>
        ))}
      </div>
    </div>
  );
}
