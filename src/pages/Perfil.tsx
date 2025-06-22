
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Heart, LogOut, Calendar, FileText } from "lucide-react";

const Perfil = () => {
  const { userData, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      navigate("/login");
      return;
    }

    if (userData.userType !== 'paciente') {
      navigate("/login");
      return;
    }

    if (!userData.onboardingCompleted) {
      navigate("/onboarding");
      return;
    }
  }, [user, userData, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">AgendarBrasil</h1>
                <p className="text-sm text-gray-600">Perfil do Paciente</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Perfil Principal */}
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-900">{userData.displayName}</CardTitle>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Heart className="w-3 h-3 mr-1" />
                  Paciente
                </Badge>
                <Badge variant="outline" className="border-green-200 text-green-700">
                  Ativo
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Informações Básicas */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{userData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Membro desde</label>
                  <p className="text-gray-900">
                    {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Último acesso</label>
                  <p className="text-gray-900">
                    {new Date(userData.lastLogin).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-green-600" />
                  Status da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Usuário</label>
                  <p className="text-gray-900 capitalize">{userData.userType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cadastro Completo</label>
                  <p className="text-gray-900">
                    {userData.onboardingCompleted ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Conta Ativa</label>
                  <p className="text-gray-900">
                    {userData.isActive ? 'Sim' : 'Não'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => navigate("/agendamento")}
                  className="bg-blue-500 hover:bg-blue-600 h-auto py-4 flex-col gap-2"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Agendar Consulta</span>
                </Button>
                <Button
                  onClick={() => navigate("/agenda-paciente")}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-blue-200 hover:bg-blue-50"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Minha Agenda</span>
                </Button>
                <Button
                  onClick={() => navigate("/historico")}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-green-200 hover:bg-green-50"
                >
                  <FileText className="w-6 h-6" />
                  <span>Histórico</span>
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <Heart className="w-6 h-6" />
                  <span>Página Inicial</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
