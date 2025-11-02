import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/dashboard-v3/DashboardHeader";
import { DashboardGrid } from "@/components/dashboard-v3/DashboardGrid";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  useDashboardMetrics,
  useDashboardAppointments,
  useDashboardAlerts,
} from '@/hooks/dashboard';

/**
 * Dashboard Content Component
 * Separated to use DashboardContext hooks
 */
const DashboardContent: React.FC = () => {
  const { user, userData } = useAuth();
  const { period } = useDashboard();
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data using React Query hooks with period from context
  const metricsQuery = useDashboardMetrics(period);
  const appointmentsQuery = useDashboardAppointments(5);
  const alertsQuery = useDashboardAlerts();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all dashboard queries to force refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['consultas-chart'] }),
        queryClient.invalidateQueries({ queryKey: ['consultation-type'] }),
      ]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faça login para acessar o dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const doctorName = userData?.displayName || 'Médico';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-blue-50/30">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-14 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="ml-4" />
          </header>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Dashboard Header */}
              <DashboardHeader
                doctorName={doctorName}
                lastUpdated={lastUpdated}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />

              {/* Dashboard Grid - Main content area */}
              <DashboardGrid />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

/**
 * Dashboard Médico V3
 * 
 * Refatoração completa do dashboard com foco em:
 * - Performance otimizada
 * - Design responsivo moderno
 * - UX intuitiva
 * - Métricas em tempo real
 */
const DashboardMedicoV3: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default DashboardMedicoV3;
