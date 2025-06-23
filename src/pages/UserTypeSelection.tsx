import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Stethoscope, ArrowLeft, Home, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const { setUserType } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserTypeSelection = async (type: 'paciente' | 'medico') => {
    setIsSubmitting(true);
    
    try {
      await setUserType(type);
      
      toast({
        title: `Tipo de usuário definido!`,
        description: `Você foi cadastrado como ${type}. Vamos completar seu perfil.`,
      });
      
      navigate("/onboarding");
    } catch (error) {
      console.error('Erro ao definir tipo de usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível definir o tipo de usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    toast({
      title: "Redirecionando...",
      description: "Voltando para a página de login",
    });
    navigate("/login");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Login
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoHome}
            className="flex items-center gap-2"
            disabled={isSubmitting}
          >
            <Home className="w-4 h-4" />
            Início
          </Button>
        </div>

        {/* Logo and Instructions */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <img 
                src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
                alt="AgendarBrasil Logo" 
                className="w-32 h-32 object-cover rounded-2xl shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl group-hover:shadow-blue-200/30" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-sm transition-all duration-500"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Bem-vindo ao AgendarBrasil!</h1>
          <p className="text-gray-600 text-lg mb-4">Para começar, nos diga como você pretende usar nossa plataforma:</p>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">2</div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">3</div>
          </div>
          <p className="text-sm text-gray-500">Etapa 1 de 3: Escolha seu tipo de usuário</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Paciente Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-300" 
                onClick={() => !isSubmitting && handleUserTypeSelection('paciente')}>
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-900">Sou Paciente</CardTitle>
              <CardDescription className="text-base">
                Quero agendar consultas e cuidar da minha saúde
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 mb-4"
                onClick={() => handleUserTypeSelection('paciente')}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processando..." : "Continuar como Paciente"}
              </Button>
              <div className="text-sm text-gray-600">
                <h4 className="font-semibold mb-2">Como paciente você pode:</h4>
                <ul className="space-y-1 text-xs">
                  <li>✓ Agendar consultas online</li>
                  <li>✓ Visualizar histórico médico</li>
                  <li>✓ Receber lembretes de medicamentos</li>
                  <li>✓ Gerenciar seus dados de saúde</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Médico Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-green-300" 
                onClick={() => !isSubmitting && handleUserTypeSelection('medico')}>
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-900">Sou Médico</CardTitle>
              <CardDescription className="text-base">
                Quero gerenciar minha agenda e atender pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 mb-4"
                onClick={() => handleUserTypeSelection('medico')}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processando..." : "Continuar como Médico"}
              </Button>
              <div className="text-sm text-gray-600">
                <h4 className="font-semibold mb-2">Como médico você pode:</h4>
                <ul className="space-y-1 text-xs">
                  <li>✓ Gerenciar agenda de consultas</li>
                  <li>✓ Visualizar dados dos pacientes</li>
                  <li>✓ Emitir receitas digitais</li>
                  <li>✓ Controlar fluxo do consultório</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Não tem certeza?</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Você pode alterar esta configuração depois no seu perfil. Escolha a opção que melhor se adequa ao seu uso principal.
            </p>
            <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300">
              Preciso de ajuda para decidir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;
