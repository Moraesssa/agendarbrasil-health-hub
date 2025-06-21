
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Chrome } from "lucide-react";

const Login = () => {
  const { signInWithGoogle, user, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userData) {
      if (!userData.onboardingCompleted) {
        // Se não tem tipo de usuário, vai para seleção de tipo
        if (!userData.userType) {
          navigate("/user-type");
        } else {
          // Se tem tipo mas não completou onboarding, vai para onboarding
          navigate("/onboarding");
        }
      } else {
        // Onboarding completo - redirecionar baseado no tipo de usuário
        if (userData.userType === 'medico') {
          navigate("/perfil-medico");
        } else {
          navigate("/perfil");
        }
      }
    }
  }, [user, userData, navigate]);

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">AgendarBrasil</h1>
          <p className="text-gray-600">Sua saúde em primeiro lugar</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Entrar</CardTitle>
            <CardDescription className="text-center">
              Faça login com sua conta Google
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              disabled={loading}
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continuar com Google
            </Button>

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
      </div>
    </div>
  );
};

export default Login;
