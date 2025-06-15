
import { useState } from "react";
import { Calendar, Clock, Bell, User, Plus, Heart, Pill, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import QuickActions from "@/components/QuickActions";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import HealthSummary from "@/components/HealthSummary";
import MedicationReminders from "@/components/MedicationReminders";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickAction = (action: string) => {
    if (action === "Agendamento de consulta") {
      navigate("/agendamento");
    } else {
      toast({
        title: "Ação realizada!",
        description: `${action} executada com sucesso`,
      });
    }
  };

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-6">
        {/* Welcome Section */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900 mb-2 leading-tight">
            Bem-vindo ao AgendarBrasil
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Sua saúde na palma da mão - rápido, seguro e sempre disponível
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions onAction={handleQuickAction} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Appointments */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <UpcomingAppointments />
            
            {/* Calendar Overview */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Agenda do Mês
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="p-1 sm:p-2 font-medium text-gray-600 text-xs sm:text-sm">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 6;
                    const hasAppointment = [5, 12, 18, 25].includes(day);
                    const hasMedication = [3, 8, 15, 22, 29].includes(day);
                    
                    return (
                      <div
                        key={i}
                        className={`p-1 sm:p-2 rounded-lg cursor-pointer transition-all hover:bg-blue-100 text-xs sm:text-sm min-h-[32px] sm:min-h-[36px] flex items-center justify-center ${
                          day < 1 || day > 31 
                            ? 'text-gray-300' 
                            : hasAppointment 
                              ? 'bg-blue-500 text-white font-medium' 
                              : hasMedication
                                ? 'bg-green-100 text-green-700'
                                : 'hover:bg-gray-100'
                        }`}
                      >
                        {day > 0 && day <= 31 ? day : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-3 sm:gap-4 mt-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Consultas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span>Medicamentos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Health & Reminders */}
          <div className="space-y-4 sm:space-y-6">
            <HealthSummary />
            <MedicationReminders />
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-2 sm:px-4 py-2 sm:hidden">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {[
            { id: 'home', icon: Heart, label: 'Início', route: '/' },
            { id: 'calendar', icon: Calendar, label: 'Agenda', route: '/agendamento' },
            { id: 'add', icon: Plus, label: 'Agendar', isMain: true, route: '/agendamento' },
            { id: 'reminders', icon: Bell, label: 'Histórico', route: '/historico' },
            { id: 'profile', icon: User, label: 'Perfil', route: '/perfil' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.route) handleNavigation(item.route);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                item.isMain
                  ? 'bg-blue-500 text-white shadow-lg scale-110'
                  : activeTab === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <item.icon className={`h-4 w-4 ${item.isMain ? 'h-5 w-5' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 sm:hidden"></div>
    </div>
  );
};

export default Index;
