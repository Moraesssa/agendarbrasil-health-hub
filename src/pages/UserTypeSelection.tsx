
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Stethoscope } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserType } from "@/types/user";

const UserTypeSelection = () => {
  const { setUserType } = useAuth();
  const navigate = useNavigate();

  const handleUserTypeSelection = async (type: UserType) => {
    await setUserType(type);
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-900">AgendarBrasil</h1>
          <p className="text-gray-600">Como você gostaria de usar nossa plataforma?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Paciente */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-900">Sou Paciente</CardTitle>
              <CardDescription>
                Quero agendar consultas e gerenciar minha saúde
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => handleUserTypeSelection('paciente')}
              >
                Continuar como Paciente
              </Button>
              <div className="mt-4 text-sm text-gray-600">
                <h4 className="font-semibold mb-2">Como paciente você pode:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Agendar consultas online</li>
                  <li>• Visualizar histórico médico</li>
                  <li>• Receber lembretes</li>
                  <li>• Gerenciar seus dados de saúde</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Médico */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-900">Sou Médico</CardTitle>
              <CardDescription>
                Quero gerenciar minha agenda e atender pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={() => handleUserTypeSelection('medico')}
              >
                Continuar como Médico
              </Button>
              <div className="mt-4 text-sm text-gray-600">
                <h4 className="font-semibold mb-2">Como médico você pode:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Gerenciar agenda de consultas</li>
                  <li>• Visualizar dados dos pacientes</li>
                  <li>• Controlar fluxo do consultório</li>
                  <li>• Emitir receitas digitais</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;
