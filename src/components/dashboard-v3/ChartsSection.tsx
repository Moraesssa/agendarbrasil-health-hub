import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';
import { useConsultasChartData, useConsultationTypeData } from '@/hooks/dashboard';
import { useDashboard } from '@/contexts/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

/**
 * ChartsSection Component
 * 
 * Displays two charts:
 * 1. Bar chart - Consultations over the last 7 days
 * 2. Pie/Donut chart - Consultation type distribution
 */
export const ChartsSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ConsultasBarChart />
      <ConsultationTypeChart />
    </div>
  );
};

/**
 * Bar Chart - Consultas da Semana
 */
const ConsultasBarChart: React.FC = () => {
  const { data: chartData, isLoading, error } = useConsultasChartData(7);

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Consultas da Semana
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-600 text-sm">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-gray-800">Consultas da Semana</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Consultas da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!chartData || chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">Sem dados para exibir</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Donut Chart - Tipos de Consulta
 */
const ConsultationTypeChart: React.FC = () => {
  const { period } = useDashboard();
  const { data: typeData, isLoading, error } = useConsultationTypeData(
    period === 'year' ? 'year' : 'month'
  );

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <PieChart className="h-5 w-5 text-green-600" />
            Tipos de Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-600 text-sm">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-gray-800">Tipos de Consulta</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = typeData?.map((item) => ({
    name: item.type === 'presencial' ? 'Presencial' : 'Teleconsulta',
    value: item.count,
    percentage: item.percentage,
  }));

  const COLORS = ['#3b82f6', '#10b981'];

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <PieChart className="h-5 w-5 text-green-600" />
          Tipos de Consulta
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!chartData || chartData.length === 0 || chartData.every((d) => d.value === 0) ? (
          <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">Sem dados para exibir</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
