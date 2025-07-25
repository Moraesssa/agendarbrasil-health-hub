
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  User, 
  Heart, 
  Shield, 
  Activity, 
  Bell, 
  TrendingUp,
  Pill,
  Users,
  FileText,
  CheckCircle
} from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { PatientSidebar } from "@/components/PatientSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect based on user type
      if (user.user_type === 'medico') {
        navigate('/dashboard-medico');
      } else if (user.user_type === 'familiar') {
        navigate('/dashboard-familiar');
      }
      // Patients stay on the main dashboard
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bem-vindo ao Sistema de Saúde
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Gerencie sua saúde de forma inteligente e segura
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/cadastrar">Cadastrar</Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Agendamento Fácil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Agende suas consultas de forma rápida e prática
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Saúde Monitorada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Acompanhe seus dados de saúde em tempo real
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Segurança Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seus dados protegidos com criptografia avançada
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Link para validação de documentos */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Precisa validar um documento médico?
            </p>
            <Button asChild variant="link" size="sm">
              <Link to="/validar-documento" className="text-blue-600 hover:text-blue-700">
                <CheckCircle className="h-4 w-4 mr-1" />
                Validar Documento
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PatientSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="border-b bg-white px-4 py-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Dashboard do Paciente</h1>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próximas Consultas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    Esta semana
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Medicamentos</CardTitle>
                  <Pill className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">
                    Ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Familiares</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    Conectados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    Atestados e receitas
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Consultas</CardTitle>
                  <CardDescription>
                    Suas próximas consultas agendadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Dr. João Silva</p>
                        <p className="text-xs text-muted-foreground">Cardiologia - Amanhã 14:00</p>
                      </div>
                      <Badge variant="outline">Confirmada</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Dra. Maria Santos</p>
                        <p className="text-xs text-muted-foreground">Dermatologia - Sexta 09:30</p>
                      </div>
                      <Badge variant="outline">Agendada</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lembretes de Medicamentos</CardTitle>
                  <CardDescription>
                    Próximos horários dos seus medicamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                        <Pill className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Omeprazol 20mg</p>
                        <p className="text-xs text-muted-foreground">Tomar em 30 minutos</p>
                      </div>
                      <Badge variant="secondary">Urgente</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <Pill className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Vitamina D</p>
                        <p className="text-xs text-muted-foreground">Tomar às 20:00</p>
                      </div>
                      <Badge variant="outline">Hoje</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Suas atividades recentes no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">Consulta com Dr. João Silva realizada</p>
                      <p className="text-xs text-muted-foreground">Há 2 dias</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">Novo atestado médico recebido</p>
                      <p className="text-xs text-muted-foreground">Há 3 dias</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <Pill className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">Receita médica renovada</p>
                      <p className="text-xs text-muted-foreground">Há 1 semana</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
