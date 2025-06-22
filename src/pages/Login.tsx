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
    console.log('Login page - user:', !!user, 'userData:', !!userData, 'loading:', loading);
    console.log('UserData details:', userData);

    // Only process redirection if not loading
    if (loading) return;

    // If user is logged in and we have userData
    if (user && userData) {
      console.log('Redirecting user based on userData:', userData);

      // Check if user type is not set (new user needs to select type)
      if (!userData.userType || userData.userType === null) {
        console.log('No user type set, redirecting to user-type selection');
        navigate("/user-type");
        return;
      }

      // Check if needs to complete onboarding
      if (!userData.onboardingCompleted) {
        console.log('User type exists but onboarding not complete, redirecting to onboarding');
        navigate("/onboarding");
        return;
      }

      // Onboarding complete - redirect to profile
      console.log('Onboarding complete, redirecting to profile');
      if (userData.userType === 'medico') {
        navigate("/perfil-medico");
      } else {
        navigate("/perfil");
      }
    }
    // If user exists but userData is null and we're not loading, wait a bit more
    else if (user && !userData && !loading) {
      console.log('User exists but userData is null, will wait for profile creation...');
    }
  }, [user, userData, loading, navigate]);

  const handleGoogleLogin = async () => {
    console.log('Attempting Google login...');
    await signInWithGoogle();
  };

  // Show loading while processing authentication or waiting for profile
  if (loading || (user && !userData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>{user && !userData ? 'Configurando seu perfil...' : 'Carregando...'}</p>
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
