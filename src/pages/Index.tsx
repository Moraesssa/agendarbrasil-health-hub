import { useState } from "react";
import { Calendar, Clock, Bell, User, Plus, Heart, Pill, CalendarCheck, MapPin, Phone, LogIn, UserPlus, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import QuickActions from "@/components/QuickActions";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import HealthSummary from "@/components/HealthSummary";
import MedicationReminders from "@/components/MedicationReminders";
import { DocumentList } from "@/components/health/DocumentList";
import { DocumentUpload } from "@/components/health/DocumentUpload";
import { useDocuments } from "@/hooks/useDocuments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendarData } from "@/hooks/useCalendarData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents, loading: docsLoading, uploading, uploadDocument, deleteDocument, getDocumentUrl } = useDocuments();
  const { calendarData, loading: calendarLoading } = useCalendarData();

  const requireAuth = (callback: () => void, actionName: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: `Para ${actionName.toLowerCase()}, você precisa fazer login primeiro`,
        variant: "default",
      });
      navigate("/login");
      return;
    }
    callback();
  };

  const handleDayClick = (day: number, hasAppointment: boolean, hasMedication: boolean, appointmentStatus?: string) => {
    if (hasAppointment) {
      requireAuth(() => {
        const statusText = appointmentStatus === 'cancelada' ? 'cancelada' : 'agendada';
        toast({
          title: `Consulta ${statusText}`,
          description: `Você tem uma consulta ${statusText} para o dia ${day}. Clique para ver detalhes.`,
        });
        navigate("/agenda-paciente");
      }, "ver detalhes da consulta");
    } else if (hasMedication) {
      toast({
        title: "Lembrete de medicamento",
        description: `Você tem medicamentos programados para o dia ${day}`,
      });
    } else if (day > 0 && day <= 31) {
      requireAuth(() => {
        toast({
          title: "Agendar consulta",
          description: `Gostaria de agendar uma consulta para o dia ${day}?`,
        });
        navigate("/agendamento");
      }, "agendar consulta");
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "Agendamento de consulta":
        requireAuth(() => {
          toast({
            title: "Redirecionando para agendamento",
            description: "Vamos ajudá-lo a marcar sua consulta",
          });
          navigate("/agendamento");
        }, "agendar consulta");
        break;
      case "Reagendar consulta":
        requireAuth(() => {
          toast({
            title: "Acessando sua agenda",
            description: "Você pode reagendar suas consultas existentes",
          });
          navigate("/agenda-paciente");
        }, "reagendar consulta");
        break;
      case "Ver histórico médico":
        requireAuth(() => {
          toast({
            title: "Carregando histórico",
            description: "Visualize seu histórico completo de consultas",
          });
          navigate("/historico");
        }, "ver histórico médico");
        break;
      case "Atualizar perfil":
        requireAuth(() => {
          toast({
            title: "Acessando perfil",
            description: "Mantenha seus dados sempre atualizados",
          });
          navigate("/perfil");
        }, "atualizar perfil");
        break;
      case "Agendamento de check-up":
        requireAuth(() => {
          toast({
            title: "Agendando check-up",
            description: "Exames preventivos são importantes para sua saúde",
          });
          navigate("/agendamento");
        }, "agendar check-up");
        break;
      case "Consulta por telemedicina":
        toast({
          title: "Telemedicina em breve!",
          description: "Esta funcionalidade estará disponível em breve. Você será notificado quando estiver pronta",
        });
        break;
      case "Agendamento urgente":
        toast({
          title: "Urgência Médica",
          description: "Para emergências, ligue 192 (SAMU) ou procure o pronto-socorro mais próximo imediatamente",
          variant: "destructive"
        });
        break;
      case "Agendamento familiar":
        requireAuth(() => {
          toast({
            title: "Agendamento Familiar",
            description: "Em breve você poderá gerenciar consultas de toda a família em um só lugar",
          });
        }, "agendar para família");
        break;
      default:
        toast({
          title: "Ação realizada!",
          description: `${action} executada com sucesso`,
        });
    }
  };

  const handleNavigation = (route: string, title?: string) => {
    const protectedRoutes = ["/agendamento", "/agenda-paciente", "/historico", "/perfil", "/gestao-medicamentos"];
    
    if (protectedRoutes.includes(route)) {
      requireAuth(() => {
        if (title) {
          toast({
            title: `Navegando para ${title}`,
            description: "Carregando página...",
          });
        }
        navigate(route);
      }, title || "acessar esta página");
    } else {
      if (title) {
        toast({
          title: `Navegando para ${title}`,
          description: "Carregando página...",
        });
      }
      navigate(route);
    }
  };

  const handleEmergencyContact = () => {
    toast({
      title: "Contatos de Emergência",
      description: "SAMU: 192 | Bombeiros: 193 | Polícia: 190",
      variant: "destructive"
    });
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
              onClick={() => handleNavigation("/agendamento", "Agendamento")}
              className="bg-blue-500 hover:bg-blue-600 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all"
              size="sm"
              title="Agende uma nova consulta médica"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agendar Consulta
            </Button>
            <Button 
              onClick={() => handleNavigation("/agenda-paciente", "Minha Agenda")}
              variant="outline"
              className="text-sm sm:text-base border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              size="sm"
              title="Visualize suas consultas agendadas"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Minha Agenda
            </Button>
            <Button 
              onClick={() => handleNavigation("/gestao-medicamentos", "Medicamentos")}
              variant="outline"
              className="text-sm sm:text-base border-green-200 hover:bg-green-50 hover:border-green-300"
              size="sm"
              title="Gerencie suas prescrições e medicamentos"
            >
              <Pill className="h-4 w-4 mr-2" />
              Medicamentos
            </Button>
            <Button 
              onClick={() => handleNavigation("/historico", "Histórico Médico")}
              variant="outline"
              className="text-sm sm:text-base border-green-200 hover:bg-green-50 hover:border-green-300"
              size="sm"
              title="Veja seu histórico médico completo"
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Histórico
            </Button>
            <Button 
              onClick={() => handleNavigation("/perfil", "Meu Perfil")}
              variant="outline"
              className="text-sm sm:text-base border-purple-200 hover:bg-purple-50 hover:border-purple-300"
              size="sm"
              title="Acesse e edite seu perfil"
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </Button>
            <Button 
              onClick={() => handleNavigation("/gerenciar-conexoes", "Conexões")}
              variant="outline"
              className="text-sm sm:text-base border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
              size="sm"
              title="Gerenciar integrações com laboratórios e clínicas"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Conexões
            </Button>
            <Button 
              onClick={handleEmergencyContact}
              variant="outline"
              className="text-sm sm:text-base border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
              size="sm"
              title="Contatos de emergência"
            >
              <Phone className="h-4 w-4 mr-2" />
              Emergência
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions onAction={handleQuickAction} />

        {user ? (
          <>
            {/* Main Content Grid - Logged In */}
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
                        onClick={() => handleNavigation("/agenda-paciente", "Agenda Detalhada")}
                        className="text-blue-600 hover:text-blue-700"
                        title="Ver agenda completa"
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    {calendarLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-pulse text-gray-500">Carregando calendário...</div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                            <div key={day} className="p-1 sm:p-2 font-medium text-gray-600 text-xs sm:text-sm">
                              {day}
                            </div>
                          ))}
                          {calendarData.map((dayData, i) => {
                            const { day, hasAppointment, hasMedication, appointmentStatus, appointmentCount } = dayData;
                            
                            let dayClasses = "p-1 sm:p-2 rounded-lg cursor-pointer transition-all hover:bg-blue-100 text-xs sm:text-sm min-h-[32px] sm:min-h-[36px] flex items-center justify-center ";
                            let titleText = '';
                            
                            if (day < 1 || day > 31) {
                              dayClasses += 'text-gray-300';
                            } else if (hasAppointment) {
                              switch (appointmentStatus) {
                                case 'confirmada':
                                  dayClasses += 'bg-blue-600 text-white font-medium shadow-md hover:bg-blue-700';
                                  titleText = `Consulta confirmada para o dia ${day} - Clique para ver detalhes`;
                                  break;
                                case 'agendada':
                                  dayClasses += 'bg-purple-500 text-white font-medium shadow-md hover:bg-purple-600';
                                  titleText = `Consulta agendada para o dia ${day} - Clique para ver detalhes`;
                                  break;
                                case 'cancelada':
                                  dayClasses += 'bg-gray-300 text-gray-600 font-medium shadow-sm hover:bg-gray-400';
                                  titleText = `Consulta cancelada para o dia ${day}`;
                                  break;
                                case 'pendente':
                                  dayClasses += 'bg-yellow-400 text-yellow-900 font-medium shadow-md hover:bg-yellow-500';
                                  titleText = `Consulta pendente para o dia ${day} - Clique para ver detalhes`;
                                  break;
                                default:
                                  dayClasses += 'bg-purple-500 text-white font-medium shadow-md hover:bg-purple-600';
                                  titleText = `Consulta para o dia ${day} - Clique para ver detalhes`;
                              }
                            } else if (hasMedication) {
                              dayClasses += 'bg-green-100 text-green-700 hover:bg-green-200';
                              titleText = `Lembrete de medicamento para o dia ${day}`;
                            } else {
                              dayClasses += 'hover:bg-gray-100';
                              titleText = day > 0 && day <= 31 ? 'Clique para agendar uma consulta' : '';
                            }
                            
                            return (
                              <div
                                key={i}
                                className={dayClasses}
                                onClick={() => handleDayClick(day, hasAppointment, hasMedication, appointmentStatus)}
                                title={titleText}
                              >
                                {day > 0 && day <= 31 ? (
                                  <div className="relative">
                                    {day}
                                    {appointmentCount > 1 && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-white font-bold">{appointmentCount}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : ''}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-center gap-3 sm:gap-4 mt-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded"></div>
                            <span>Agendada</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-600 rounded"></div>
                            <span>Confirmada</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                            <span>Pendente</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-300 rounded"></div>
                            <span>Cancelada</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded"></div>
                            <span>Medicamentos</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Health & Reminders */}
              <div className="space-y-4 sm:space-y-6">
                <HealthSummary />
                <MedicationReminders />
                
                {/* Documents Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">Documentos de Saúde</h2>
                    <DocumentUpload onUpload={uploadDocument} isUploading={uploading} />
                  </div>
                  <DocumentList 
                    documents={documents} 
                    loading={docsLoading} 
                    onDelete={deleteDocument}
                    onGetUrl={getDocumentUrl}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-center text-blue-900">
                Gerenciamento completo da sua saúde
              </CardTitle>
              <CardDescription className="text-center text-gray-600 max-w-xl mx-auto">
                Crie sua conta ou faça login para acessar todas as funcionalidades e cuidar da sua saúde de forma integrada e digital.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CalendarCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Agende Consultas</h3>
                  <p className="text-sm text-gray-500">Encontre especialistas e marque consultas online com facilidade.</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Pill className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Controle Medicamentos</h3>
                  <p className="text-sm text-gray-500">Receba lembretes e nunca mais se esqueça de um horário.</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Acesse seu Histórico</h3>
                  <p className="text-sm text-gray-500">Tenha todos os seus exames e diagnósticos em um só lugar.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => navigate('/login')} size="lg" className="bg-blue-500 hover:bg-blue-600">
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </Button>
                <Button onClick={() => navigate('/login')} variant="outline" size="lg">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Criar Conta Grátis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-2 sm:px-4 py-2 sm:hidden shadow-lg">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {[
              { id: 'home', icon: Heart, label: 'Início', route: '/', description: 'Página inicial' },
              { id: 'calendar', icon: Calendar, label: 'Agenda', route: '/agenda-paciente', description: 'Ver suas consultas' },
              { id: 'add', icon: Plus, label: 'Agendar', isMain: true, route: '/agendamento', description: 'Agendar nova consulta' },
              { id: 'medications', icon: Pill, label: 'Medicamentos', route: '/gestao-medicamentos', description: 'Gerenciar medicamentos' },
              { id: 'profile', icon: User, label: 'Perfil', route: '/perfil', description: 'Configurações do perfil' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.route) handleNavigation(item.route, item.label);
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  item.isMain
                    ? 'bg-blue-500 text-white shadow-lg scale-110 hover:bg-blue-600'
                    : activeTab === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title={item.description}
              >
                <item.icon className={`h-4 w-4 ${item.isMain ? 'h-5 w-5' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 sm:hidden"></div>
    </div>
  );
};

export default Index;
