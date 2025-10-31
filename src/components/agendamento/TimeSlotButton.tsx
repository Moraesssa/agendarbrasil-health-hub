import React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotButtonProps {
  time: string;
  available: boolean;
  selected?: boolean;
  onClick: () => void;
}

export function TimeSlotButton({ 
  time, 
  available, 
  selected = false,
  onClick 
}: TimeSlotButtonProps) {
  return (
    <Button
      variant={selected ? "default" : "outline"}
      disabled={!available}
      onClick={onClick}
      className={cn(
        "h-14 flex flex-col items-center justify-center gap-1 transition-all duration-200",
        "hover:scale-105 hover:shadow-md active:scale-95",
        selected && "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50",
        !available && "opacity-40 cursor-not-allowed line-through"
      )}
    >
      <Clock className="w-4 h-4" />
      <span className="font-semibold text-sm">{time}</span>
    </Button>
  );
}
