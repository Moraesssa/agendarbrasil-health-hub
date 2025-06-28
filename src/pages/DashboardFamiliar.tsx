
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PatientSidebar } from '@/components/PatientSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Calendar, 
  Shield, 
  FileText, 
  Bell, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useMedicalManagement } from '@/hooks/useMedicalManagement';
import { useFamilyManagement } from '@/hooks/useFamilyManagement';
import { PageLoader } from '@/components/PageLoader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardFamiliar = () => {
  const {
    upcomingActivities,
    notifications,
    vaccines,
    exams,
    loading: medicalLoading,
    markNotificationAsRead
  } = useMedicalManagement();

  const { familyMembers, loading: familyLoading } = useFamilyManagement();

  if (medicalLoading || familyLoading) {
    return <PageLoader message="Carregando dashboard familiar..." />;
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'consultation': return Calendar;
      case 'vaccine': return Shield;
      case 'exam': return FileText;
      default: return Activity;
    }
  };

  const overdueDoses = vaccines.filter(v => v.status === 'overdue').length;
  const pendingExams = exams.filter(e => e.status === 'scheduled').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 to-blue-50">
        <PatientSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-green-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-green-600 hover:bg-green-50" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-blue-600 bg-clip-text text-transparent">
                Dashboard Familiar
              </h1>
              <p className="text-sm text-gray-600">
                Visão geral da saúde da sua família
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Cards de estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Membros da Família</p>
                      <p className="text-2xl font-bold">{familyMembers.length}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <Bell className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Notificações</p>
                      <p className="text-2xl font-bold">{unreadNotifications}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Vacinas Atrasadas</p>
                      <p className="text-2xl font-bold">{overdueDoses}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Exames Pendentes</p>
                      <p className="text-2xl font-bold">{pendingExams}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Próximas atividades */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      Próximas Atividades
                    </CardTitle>
                    <CardDescription>
                      Consultas, exames e vacinas agendados para sua família
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingActivities.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                          Nenhuma atividade pendente
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Sua família está em dia com consultas e exames!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingActivities.slice(0, 5).map((activity, index) => {
                          const Icon = getActivityIcon(activity.activity_type);
                          return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                              <div className="flex items-center space-x-3">
                                <Icon className="h-5 w-5 text-gray-600" />
                                <div>
                                  <p className="text-sm font-medium">{activity.title}</p>
                                  <p className="text-xs text-gray-500">{activity.patient_name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-900">
                                  {format(new Date(activity.scheduled_date), 'dd/MM', { locale: ptBR })}
                                </p>
                                <Badge 
                                  variant="outline"
                                  className={`text-xs ${getUrgencyColor(activity.urgency)}`}
                                >
                                  {activity.urgency === 'high' ? 'Urgente' : 
                                   activity.urgency === 'medium' ? 'Médio' : 'Normal'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notificações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      Notificações Recentes
                    </CardTitle>
                    <CardDescription>
                      Alertas e lembretes para sua família
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                          Nenhuma notificação
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Você está em dia com todas as atividades!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.slice(0, 5).map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`flex items-start justify-between p-3 rounded-lg border ${
                              notification.read ? 'bg-gray-50' : 'bg-white'
                            }`}
                          >
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                notification.read ? 'text-gray-600' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              <Badge 
                                variant={notification.priority === 'urgent' ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {notification.priority === 'urgent' ? 'Urgente' : 
                                 notification.priority === 'high' ? 'Alta' : 
                                 notification.priority === 'normal' ? 'Normal' : 'Baixa'}
                              </Badge>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ações rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Acesse rapidamente as funcionalidades mais usadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Calendar className="h-6 w-6 mb-2" />
                      <span className="text-sm">Nova Consulta</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Shield className="h-6 w-6 mb-2" />
                      <span className="text-sm">Registrar Vacina</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm">Agendar Exame</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Activity className="h-6 w-6 mb-2" />
                      <span className="text-sm">Triagem Médica</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardFamiliar;
