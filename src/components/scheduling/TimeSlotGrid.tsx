
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeSlot } from "@/utils/timeSlotUtils";

interface TimeSlotGridProps {
  timeSlots: TimeSlot[] | undefined;
  selectedTime: string;
  selectedDate: string;
  selectedDoctor: string;
  isLoading: boolean;
  onChange: (time: string) => void;
}

export const TimeSlotGrid = ({ 
  timeSlots, 
  selectedTime, 
  selectedDate, 
  selectedDoctor, 
  isLoading, 
  onChange 
}: TimeSlotGridProps) => {
  if (!selectedDate || !selectedDoctor) return null;

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Horário {isLoading && "(Carregando...)"}
      </label>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {timeSlots?.length === 0 && (
            <p className="col-span-full text-center text-gray-500">
              Nenhum horário disponível.
            </p>
          )}
          {timeSlots?.map((slot: TimeSlot) => (
            <Button 
              key={slot.time} 
              variant={selectedTime === slot.time ? "default" : "outline"} 
              onClick={() => onChange(slot.time)} 
              disabled={!slot.available}
              className={`text-sm ${
                !slot.available 
                  ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" 
                  : ""
              }`}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
