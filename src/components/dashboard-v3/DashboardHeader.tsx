import React from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PeriodFilter } from './PeriodFilter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardHeaderProps {
  doctorName: string;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  doctorName,
  lastUpdated,
  onRefresh,
  isRefreshing
}) => {
  const currentDate = new Date();
  const greeting = getGreeting();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {greeting}, Dr(a). {doctorName}
        </h1>
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Actions Section */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Filter */}
        <PeriodFilter />

        {/* Last Updated Badge */}
        {lastUpdated && (
          <Badge variant="secondary" className="hidden sm:flex">
            Atualizado às {format(lastUpdated, 'HH:mm', { locale: ptBR })}
          </Badge>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
    </div>
  );
};

/**
 * Get greeting based on time of day
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Bom dia';
  } else if (hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
}
