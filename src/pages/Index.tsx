
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Heart } from "lucide-react";
import QuickActions from "@/components/QuickActions";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import HealthSummary from "@/components/HealthSummary";
import MedicationReminders from "@/components/MedicationReminders";
import { NotificationBadge } from "@/components/NotificationBadge";
import { PageLoader } from "@/components/PageLoader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }

  // Redirect based on user type
  if (userData?.userType === 'medico') {
    window.location.href = '/dashboard-medico';
    return null;
  } else if (userData?.userType === 'paciente') {
    // Show patient dashboard
  }

  const handleQuickAction = (action: string) => {
    console.log("Quick action:", action);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vindo, {userData?.displayName || user?.email}!
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBadge />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            <QuickActions onAction={handleQuickAction} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UpcomingAppointments />
              <HealthSummary />
            </div>
          </div>

          {/* Right Column - Secondary Info */}
          <div className="space-y-6">
            <MedicationReminders />
            
            {/* Health Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Resumo de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Consultas este mês</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medicamentos ativos</span>
                  <Badge variant="secondary">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Próximos exames</span>
                  <Badge variant="secondary">1</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
