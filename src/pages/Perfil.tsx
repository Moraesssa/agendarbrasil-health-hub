
import { useState } from "react";
import { ArrowLeft, User, Edit, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(11) 99999-9999",
    cpf: "123.456.789-00",
    dataNascimento: "1990-05-15",
    endereco: "Rua das Flores, 123",
    cidade: "São Paulo",
    cep: "01234-567",
    convenio: "Unimed",
    numeroCarteirinha: "123456789",
    contatoEmergencia: "Maria Silva - (11) 88888-8888"
  });

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram salvas com sucesso."
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais</p>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Foto e Informações Básicas */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Foto do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative mx-auto w-32 h-32">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  JS
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profile.nome}</h3>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Completo</label>
                  <input
                    type="text"
                    value={profile.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={profile.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CPF</label>
                  <input
                    type="text"
                    value={profile.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
                  <input
                    type="date"
                    value={profile.dataNascimento}
                    onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CEP</label>
                  <input
                    type="text"
                    value={profile.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Endereço</label>
                <input
                  type="text"
                  value={profile.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Convênio</label>
                  <input
                    type="text"
                    value={profile.convenio}
                    onChange={(e) => handleInputChange('convenio', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Número da Carteirinha</label>
                  <input
                    type="text"
                    value={profile.numeroCarteirinha}
                    onChange={(e) => handleInputChange('numeroCarteirinha', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contato de Emergência</label>
                <input
                  type="text"
                  value={profile.contatoEmergencia}
                  onChange={(e) => handleInputChange('contatoEmergencia', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Perfil;
