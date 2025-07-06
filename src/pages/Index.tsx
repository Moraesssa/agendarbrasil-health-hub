import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Heart, FileText, Phone, MapPin } from "lucide-react";
import HealthSummary from "@/components/HealthSummary";

const Index = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      return; // Permitir acesso à página inicial mesmo sem login
    }

    // Redirecionar médicos para seu dashboard
    if (userData.userType === 'medico' && userData.onboardingCompleted) {
      navigate('/dashboard-medico');
      return;
    }

    // Se não completou onboarding, redirecionar
    if (!userData.onboardingCompleted) {
      navigate('/onboarding');
      return;
    }
  }, [user, userData, loading, navigate]);

  // Se não está logado, mostrar página inicial pública
  if (!user || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">AgendarBrasil</span>
            </div>
            <div className="space-x-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/cadastrar')}>
                Cadastrar
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Sua saúde em primeiro lugar
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Conectamos você aos melhores profissionais de saúde. Agende consultas, gerencie sua saúde e cuide de quem você ama.
            </p>
            <div className="space-x-4">
              <Button size="lg" onClick={() => navigate('/cadastrar')}>
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Já tenho conta
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <Calendar className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Agendamento Fácil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Encontre e agende consultas com os melhores médicos da sua região em poucos cliques.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Gestão Familiar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gerencie a saúde de toda sua família em um só lugar. Histórico completo e organizado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Cuidado Personalizado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Profissionais qualificados prontos para oferecer o melhor atendimento para você.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Se é paciente logado, mostrar dashboard do paciente
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">AgendarBrasil</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Olá, {userData.displayName}</span>
            <Button variant="outline" onClick={() => navigate('/perfil')}>
              Meu Perfil
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta, {userData.displayName}!
            </h1>
            <p className="text-gray-600">
              Gerencie sua saúde e agende suas consultas
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Ações Rápidas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button 
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => navigate('/agendamento')}
                    >
                      <Calendar className="h-6 w-6" />
                      <span>Agendar Consulta</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => navigate('/agenda-paciente')}
                    >
                      <FileText className="h-6 w-6" />
                      <span>Minha Agenda</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => navigate('/historico')}
                    >
                      <FileText className="h-6 w-6" />
                      <span>Histórico</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center space-y-2"
                      onClick={() => navigate('/gerenciar-familia')}
                    >
                      <Users className="h-6 w-6" />
                      <span>Família</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo da Saúde */}
            <div>
              <HealthSummary />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
