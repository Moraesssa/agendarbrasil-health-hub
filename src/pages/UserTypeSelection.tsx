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

        {/* Enhanced Logo and Instructions */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              {/* Main Logo Container */}
              <div className="relative">
                <img 
                  src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
                  alt="AgendarBrasil Logo" 
                  className="w-40 h-40 object-cover rounded-3xl shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:shadow-4xl group-hover:shadow-blue-300/40 border-4 border-white/20" 
                />
                
                {/* Animated Gradient Border */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-3xl opacity-30 group-hover:opacity-60 blur-lg transition-all duration-700 animate-pulse"></div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-3xl backdrop-blur-sm"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 rounded-3xl transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%]"></div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce delay-100"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce delay-300"></div>
            </div>
          </div>
          
          {/* Enhanced Title */}
          <div className="relative mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 via-purple-600 to-green-600 bg-clip-text text-transparent mb-3 animate-fade-in">
              Bem-vindo ao AgendarBrasil!
            </h1>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-60"></div>
          </div>
          
          <p className="text-gray-600 text-lg mb-4 font-medium">Para começar, nos diga como você pretende usar nossa plataforma:</p>
          
          {/* Enhanced Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">1</div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-30 blur-sm animate-pulse"></div>
            </div>
            <div className="w-16 h-2 bg-gradient-to-r from-blue-200 to-gray-300 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium shadow-md">2</div>
            <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium shadow-md">3</div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Etapa 1 de 3: Escolha seu tipo de usuário</p>
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
