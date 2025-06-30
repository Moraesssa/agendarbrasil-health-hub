
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: string | null;
  isCompleted: boolean;
}

export const InfoRow = ({ icon: Icon, label, value, isCompleted }: InfoRowProps) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", isCompleted ? "text-green-600" : "text-gray-400")} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="text-sm text-gray-600">
        {value || "Não selecionado"}
      </div>
    </div>
  );
};
