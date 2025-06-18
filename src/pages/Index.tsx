
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
    switch (action) {
      case "Agendamento de consulta":
        navigate("/agendamento");
        break;
      case "Reagendar consulta":
        navigate("/agenda-paciente");
        break;
      case "Ver histórico médico":
        navigate("/historico");
        break;
      case "Atualizar perfil":
        navigate("/perfil");
        break;
      case "Lembrete de medicamento":
        toast({
          title: "Lembrete configurado!",
          description: "Você receberá notificações sobre seus medicamentos",
        });
        break;
      case "Agendamento de check-up":
        navigate("/agendamento");
        break;
      case "Consulta por telemedicina":
        toast({
          title: "Telemedicina",
          description: "Funcionalidade em breve! Você será notificado quando estiver disponível",
        });
        break;
      case "Agendamento urgente":
        toast({
          title: "Urgência",
          description: "Para emergências, ligue 192 (SAMU) ou procure o pronto-socorro mais próximo",
          variant: "destructive"
        });
        break;
      case "Agendamento familiar":
        toast({
          title: "Agendamento Familiar",
          description: "Funcionalidade em desenvolvimento para gerenciar consultas da família",
        });
        break;
      default:
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
          
          {/* Quick Access Buttons */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-6">
            <Button 
              onClick={() => navigate("/agendamento")}
              className="bg-blue-500 hover:bg-blue-600 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agendar Consulta
            </Button>
            <Button 
              onClick={() => navigate("/agenda-paciente")}
              variant="outline"
              className="text-sm sm:text-base border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Minha Agenda
            </Button>
            <Button 
              onClick={() => navigate("/historico")}
              variant="outline"
              className="text-sm sm:text-base border-green-200 hover:bg-green-50 hover:border-green-300"
              size="sm"
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Histórico
            </Button>
          </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    Agenda do Mês
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate("/agenda-paciente")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Ver detalhes
                  </Button>
                </div>
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
                              ? 'bg-blue-500 text-white font-medium shadow-md hover:bg-blue-600' 
                              : hasMedication
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          if (hasAppointment) {
                            navigate("/agenda-paciente");
                            toast({
                              title: "Consulta agendada",
                              description: `Você tem uma consulta marcada para o dia ${day}`,
                            });
                          } else if (day > 0 && day <= 31) {
                            navigate("/agendamento");
                          }
                        }}
                        title={
                          hasAppointment 
                            ? `Consulta agendada para o dia ${day}` 
                            : hasMedication 
                              ? `Lembrete de medicamento para o dia ${day}`
                              : day > 0 && day <= 31 
                                ? 'Clique para agendar uma consulta'
                                : ''
                        }
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-2 sm:px-4 py-2 sm:hidden shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {[
            { id: 'home', icon: Heart, label: 'Início', route: '/' },
            { id: 'calendar', icon: Calendar, label: 'Agenda', route: '/agenda-paciente' },
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
                  ? 'bg-blue-500 text-white shadow-lg scale-110 hover:bg-blue-600'
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
