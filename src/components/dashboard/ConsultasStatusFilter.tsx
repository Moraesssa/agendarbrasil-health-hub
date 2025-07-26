
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface StatusFilterProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

export const ConsultasStatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatuses,
  onStatusChange
}) => {
  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'agendada', label: 'Agendadas' },
    { value: 'confirmada', label: 'Confirmadas' },
    { value: 'realizada', label: 'Realizadas' },
    { value: 'cancelada', label: 'Canceladas' }
  ];

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      onStatusChange([]);
    } else {
      const newStatuses = selectedStatuses.includes(value)
        ? selectedStatuses.filter(s => s !== value)
        : [...selectedStatuses, value];
      onStatusChange(newStatuses);
    }
  };

  return (
    <Select onValueChange={handleStatusChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Filtrar por status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
