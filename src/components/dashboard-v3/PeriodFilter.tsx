import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboard, DashboardPeriod } from '@/contexts/DashboardContext';
import { Calendar } from 'lucide-react';

/**
 * Period Filter Component
 * 
 * Allows users to switch between different time periods for dashboard metrics
 * Integrates with DashboardContext to update global filter state
 */
export const PeriodFilter: React.FC = () => {
  const { filters, setPeriod } = useDashboard();

  const periodLabels: Record<DashboardPeriod, string> = {
    today: 'Hoje',
    week: 'Última Semana',
    month: 'Último Mês',
    year: 'Último Ano'
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select value={filters.period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="week">Última Semana</SelectItem>
          <SelectItem value="month">Último Mês</SelectItem>
          <SelectItem value="year">Último Ano</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
