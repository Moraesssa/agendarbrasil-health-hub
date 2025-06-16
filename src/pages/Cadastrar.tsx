
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Stethoscope } from "lucide-react";

const Cadastrar = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-900">AgendarBrasil</h1>
          <p className="text-gray-600">Escolha o tipo de cadastro</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Cadastro Paciente */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/cadastro-paciente")}>
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-900">Sou Paciente</CardTitle>
              <CardDescription>
                Cadastre-se para agendar consultas e gerenciar sua saúde
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => navigate("/cadastro-paciente")}
              >
                Cadastrar como Paciente
              </Button>
              <div className="mt-4 text-sm text-gray-600">
                <h4 className="font-semibold mb-2">Como paciente você pode:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Agendar consultas online</li>
                  <li>• Visualizar histórico médico</li>
                  <li>• Receber lembretes de medicamentos</li>
                  <li>• Gerenciar seus dados de saúde</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cadastro Médico */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate("/cadastro-medico")}>
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-900">Sou Médico</CardTitle>
              <CardDescription>
                Cadastre-se para gerenciar sua agenda e atender pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={() => navigate("/cadastro-medico")}
              >
                Cadastrar como Médico
              </Button>
              <div className="mt-4 text-sm text-gray-600">
                <h4 className="font-semibold mb-2">Como médico você pode:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Gerenciar agenda de consultas</li>
                  <li>• Visualizar dados dos pacientes</li>
                  <li>• Emitir receitas digitais</li>
                  <li>• Controlar fluxo do consultório</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cadastrar;
