import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, ArrowLeft, Stethoscope, User, Mail, Phone, MapPin, FileText, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { medicoService } from '@/services/medicoService';

const CadastroMedico = () => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    crm: "",
    especialidade: "",
    formacao: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    biografia: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
        // Aqui usamos o método existente no serviço de médicos
        const success = await medicoService.saveMedicoData({
            nome: formData.nome,
            email: formData.email,
            senha: formData.senha, // se o serviço cuida da criação de auth
            telefone: formData.telefone,
            crm: formData.crm,
            especialidade: formData.especialidade,
            formacao: formData.formacao,
            biografia: formData.biografia,
            endereco_consultorio: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            cep: formData.cep
        });

        if (!success) {
          throw new Error('Não foi possível salvar os dados do médico.');
        }

        toast({
            title: "Cadastro de médico realizado com sucesso!",
            description: `Bem-vindo(a), Dr(a). ${formData.nome}`,
        });
        navigate("/login");
    } catch (error) {
        toast({
            title: "Erro no cadastro",
            description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/cadastrar")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-900">Cadastro Médico</h1>
              <p className="text-sm text-gray-600">Preencha seus dados profissionais</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Dados do Médico</CardTitle>
            <CardDescription className="text-center">
              Todos os campos são obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Dados Pessoais
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Dr(a). João Silva"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="telefone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange("telefone", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="doutor@exemplo.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={formData.senha}
                        onChange={(e) => handleInputChange("senha", e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmarSenha"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={formData.confirmarSenha}
                        onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Dados Profissionais
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      type="text"
                      placeholder="123456/SP"
                      value={formData.crm}
                      onChange={(e) => handleInputChange("crm", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input
                      id="especialidade"
                      type="text"
                      placeholder="Cardiologia, Pediatria, etc."
                      value={formData.especialidade}
                      onChange={(e) => handleInputChange("especialidade", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formacao">Formação</Label>
                  <Input
                    id="formacao"
                    type="text"
                    placeholder="Universidade de São Paulo - USP"
                    value={formData.formacao}
                    onChange={(e) => handleInputChange("formacao", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biografia">Biografia Profissional</Label>
                  <Textarea
                    id="biografia"
                    placeholder="Conte um pouco sobre sua experiência e áreas de atuação..."
                    value={formData.biografia}
                    onChange={(e) => handleInputChange("biografia", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Endereço do Consultório
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    type="text"
                    placeholder="Rua das Flores, 123 - Centro"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      type="text"
                      placeholder="São Paulo"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange("cidade", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      type="text"
                      placeholder="SP"
                      value={formData.estado}
                      onChange={(e) => handleInputChange("estado", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      type="text"
                      placeholder="01234-567"
                      value={formData.cep}
                      onChange={(e) => handleInputChange("cep", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                disabled={isLoading}
              >
                {isLoading ? "Cadastrando..." : "Cadastrar Médico"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CadastroMedico;
