
import { useState } from "react";
import { ArrowLeft, User, Edit, Save, Camera, Stethoscope, GraduationCap, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const PerfilMedico = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nome: "Dr. Carlos Silva",
    email: "dr.carlos@email.com",
    telefone: "(11) 99999-9999",
    cpf: "123.456.789-00",
    dataNascimento: "1985-03-20",
    crm: "123456/SP",
    especialidade: "Cardiologia",
    formacao: "Universidade de São Paulo - USP",
    biografia: "Médico cardiologista com mais de 15 anos de experiência, especializado em procedimentos minimamente invasivos e prevenção cardiovascular.",
    endereco: "Av. Paulista, 1000 - Sala 1205",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100",
    horarioAtendimento: "Segunda a Sexta: 08:00 - 18:00",
    valorConsulta: "R$ 300,00",
    convenios: ["Unimed", "Bradesco Saúde", "SulAmérica", "Amil"]
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
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
              <h1 className="text-3xl font-bold text-green-900">Perfil Médico</h1>
              <p className="text-gray-600">Gerencie suas informações profissionais</p>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-green-600 hover:bg-green-700"
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
              <CardTitle className="text-center text-green-900">Foto do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative mx-auto w-32 h-32">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  CS
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-green-600"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profile.nome}</h3>
                <p className="text-gray-600">{profile.especialidade}</p>
                <p className="text-sm text-gray-500">CRM: {profile.crm}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
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
                  <label className="block text-sm font-medium mb-2">Valor da Consulta</label>
                  <input
                    type="text"
                    value={profile.valorConsulta}
                    onChange={(e) => handleInputChange('valorConsulta', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Profissionais */}
          <Card className="shadow-lg lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Stethoscope className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CRM</label>
                  <input
                    type="text"
                    value={profile.crm}
                    onChange={(e) => handleInputChange('crm', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Especialidade</label>
                  <input
                    type="text"
                    value={profile.especialidade}
                    onChange={(e) => handleInputChange('especialidade', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Horário de Atendimento</label>
                  <input
                    type="text"
                    value={profile.horarioAtendimento}
                    onChange={(e) => handleInputChange('horarioAtendimento', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Formação</label>
                <input
                  type="text"
                  value={profile.formacao}
                  onChange={(e) => handleInputChange('formacao', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Biografia Profissional</label>
                <textarea
                  value={profile.biografia}
                  onChange={(e) => handleInputChange('biografia', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Convênios Aceitos</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.convenios.map((convenio, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {convenio}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço do Consultório */}
          <Card className="shadow-lg lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <MapPin className="h-5 w-5" />
                Endereço do Consultório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <input
                    type="text"
                    value={profile.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <input
                    type="text"
                    value={profile.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PerfilMedico;
