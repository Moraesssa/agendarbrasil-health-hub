
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContextV2";
import { Chrome, ArrowLeft, Home } from "lucide-react";

const Login = () => {
  const {
    signInWithGoogle,
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();

  // A única lógica que precisamos aqui é: se o usuário JÁ ESTIVER LOGADO
  // e tentar acessar a página de login, redirecione-o para a página inicial.
  // O AuthRedirectController cuidará do resto.
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // Mantemos uma tela de loading simples para o caso do clique no botão
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBackToHome} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={handleBackToHome} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Início
          </Button>
        </div>

        {/* Logo Section - Professional Scale */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <img 
                alt="AgendarBrasil Logo" 
                src="/android-icon-192x192.png" 
                className="w-48 h-48 object-cover rounded-2xl shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl group-hover:shadow-blue-200/30"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-sm transition-all duration-500"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            AgendarBrasil
          </h1>
          <p className="text-lg text-gray-600 font-medium">Sua saúde em primeiro lugar</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Entrar</CardTitle>
            <CardDescription className="text-center">
              Faça login com sua conta Google para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoogleLogin} className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300" disabled={loading}>
              <Chrome className="w-5 h-5 mr-2" />
              Continuar com Google
            </Button>
            
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <h4 className="font-semibold text-blue-900 mb-2">Após fazer login:</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Escolha se você é paciente ou médico</li>
                <li>• Complete seu cadastro rapidamente</li>
                <li>• Comece a usar o AgendarBrasil</li>
              </ul>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Ao entrar, você concorda com nossos</p>
              <p>
                <button className="text-blue-600 hover:text-blue-500">
                  Termos de Uso
                </button>{" "}
                e{" "}
                <button className="text-blue-600 hover:text-blue-500">
                  Política de Privacidade
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Precisa de ajuda? Entre em contato conosco
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-500">
              Suporte
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              FAQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
