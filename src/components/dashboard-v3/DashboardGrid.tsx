import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';

/**
 * DashboardGrid Component
 * 
 * Responsive grid system that adapts to different screen sizes:
 * - Mobile (< 640px): 1 column
 * - Tablet (640-1024px): 2 columns
 * - Desktop (> 1024px): 4 columns
 */
export const DashboardGrid: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Metrics Section - 4 cards in a row on desktop */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardPlaceholder
          title="Total de Consultas"
          value="--"
          icon={Calendar}
          color="blue"
        />
        <MetricCardPlaceholder
          title="Receita Total"
          value="--"
          icon={TrendingUp}
          color="green"
        />
        <MetricCardPlaceholder
          title="Taxa de Ocupação"
          value="--"
          icon={BarChart3}
          color="purple"
        />
        <MetricCardPlaceholder
          title="Pacientes Únicos"
          value="--"
          icon={Users}
          color="orange"
        />
      </section>

      {/* Charts Section - 2 charts per row on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="Consultas da Semana" />
        <ChartPlaceholder title="Tipos de Consulta" />
      </section>

      {/* Lists Section - 2 columns on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListPlaceholder title="Próximas Consultas" />
        <ListPlaceholder title="Ações Rápidas" />
      </section>

      {/* Full Width Section */}
      <section className="grid grid-cols-1 gap-6">
        <FullWidthPlaceholder title="Gerenciamento" />
      </section>
    </div>
  );
};

/**
 * Temporary placeholder components
 * These will be replaced with actual widgets in subsequent tasks
 */

interface MetricCardPlaceholderProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCardPlaceholder: React.FC<MetricCardPlaceholderProps> = ({
  title,
  value,
  icon: Icon,
  color
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
      
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            <p className="text-white/80 text-sm mt-1">Em breve</p>
          </div>
          <Icon className="h-8 w-8 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
};

interface PlaceholderProps {
  title: string;
}

const ChartPlaceholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">Gráfico será implementado em breve</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ListPlaceholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">Lista será implementada em breve</p>
        </div>
      </CardContent>
    </Card>
  );
};

const FullWidthPlaceholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[150px] flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">Seção será implementada em breve</p>
        </div>
      </CardContent>
    </Card>
  );
};
