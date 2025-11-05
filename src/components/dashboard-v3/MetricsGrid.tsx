import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/dashboard';
import { useDashboard } from '@/contexts/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * MetricsGrid Component
 * 
 * Displays 4 key metrics in a responsive grid:
 * - Total Consultas
 * - Receita Total
 * - Taxa de Ocupação
 * - Pacientes Únicos
 */
export const MetricsGrid: React.FC = () => {
  const { period } = useDashboard();
  const { data: metrics, isLoading, error } = useDashboardMetrics(period);

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600 text-sm">Erro ao carregar métricas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: 'Total de Consultas',
      value: metrics?.totalConsultas || 0,
      change: metrics?.consultasChange || 0,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgDecoration: 'bg-blue-400/10',
    },
    {
      title: 'Receita Total',
      value: `R$ ${(metrics?.receitaTotal || 0).toFixed(2)}`,
      change: metrics?.receitaChange || 0,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgDecoration: 'bg-green-400/10',
    },
    {
      title: 'Taxa de Ocupação',
      value: `${(metrics?.taxaOcupacao || 0).toFixed(0)}%`,
      change: metrics?.ocupacaoChange || 0,
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      bgDecoration: 'bg-purple-400/10',
    },
    {
      title: 'Pacientes Únicos',
      value: metrics?.pacientesUnicos || 0,
      change: metrics?.pacientesChange || 0,
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgDecoration: 'bg-orange-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricsData.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  bgDecoration: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgDecoration,
}) => {
  const isPositive = change >= 0;
  
  return (
    <Card className={`bg-gradient-to-br ${color} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative`}>
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${bgDecoration} rounded-full -mr-12 -mt-12 blur-2xl`} />
      
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="flex items-center gap-1 text-sm">
              <span className={`flex items-center ${isPositive ? 'text-white/90' : 'text-white/70'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              <span className="text-white/60 text-xs">vs período anterior</span>
            </div>
          </div>
          <Icon className="h-10 w-10 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
};
