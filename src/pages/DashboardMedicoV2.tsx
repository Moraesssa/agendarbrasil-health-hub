import ComingSoonPage from '@/components/ComingSoonPage';
import { LayoutDashboard, Calendar, Users, TrendingUp } from 'lucide-react';

export default function DashboardMedicoV2() {
  return (
    <ComingSoonPage
      title="Dashboard do Médico"
      description="Visão geral completa da sua prática médica em um só lugar."
      icon={LayoutDashboard}
      backPath="/dashboard-medico"
      backLabel="Voltar ao Dashboard"
      features={[
        { icon: Calendar, label: 'Resumo de consultas do dia e da semana' },
        { icon: Users, label: 'Panorama de pacientes ativos e novos' },
        { icon: TrendingUp, label: 'Métricas financeiras e de atendimento' },
      ]}
    />
  );
}
