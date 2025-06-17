
import { useState } from "react";
import { ArrowLeft, Users, Calendar, TrendingUp, Clock, BarChart3, Activity, Heart, Stethoscope, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const DashboardMedico = () => {
  const navigate = useNavigate();

  // Dados de exemplo para os gráficos
  const consultasSemanais = [
    { dia: "Seg", consultas: 12, receita: 3600 },
    { dia: "Ter", consultas: 15, receita: 4500 },
    { dia: "Qua", consultas: 18, receita: 5400 },
    { dia: "Qui", consultas: 14, receita: 4200 },
    { dia: "Sex", consultas: 16, receita: 4800 },
    { dia: "Sáb", consultas: 8, receita: 2400 },
    { dia: "Dom", consultas: 5, receita: 1500 }
  ];

  const tiposConsulta = [
    { tipo: "Consulta Regular", valor: 45, cor: "#3b82f6" },
    { tipo: "Retorno", valor: 30, cor: "#10b981" },
    { tipo: "Emergência", valor: 15, cor: "#ef4444" },
    { tipo: "Telemedicina", valor: 10, cor: "#8b5cf6" }
  ];

  const pacientesRecentes = [
    { id: 1, nome: "Maria Silva", idade: 45, tipo: "Consulta Regular", status: "Concluída", horario: "09:00" },
    { id: 2, nome: "João Santos", idade: 32, tipo: "Retorno", status: "Em andamento", horario: "10:30" },
    { id: 3, nome: "Ana Costa", idade: 28, tipo: "Emergência", status: "Agendada", horario: "14:00" },
    { id: 4, nome: "Carlos Lima", idade: 55, tipo: "Telemedicina", status: "Agendada", horario: "15:30" }
  ];

  const chartConfig = {
    consultas: {
      label: "Consultas",
      color: "#3b82f6",
    },
    receita: {
      label: "Receita (R$)",
      color: "#10b981",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4 hover:bg-white/60"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent">
                Dashboard Médico
              </h1>
              <p className="text-gray-600 mt-2">Visão geral da sua prática médica</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Pacientes Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-blue-100 text-sm">+3 vs ontem</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Receita Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">R$ 24.6k</div>
                  <p className="text-green-100 text-sm">+15% vs sem. ant.</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Próximas Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">8</div>
                  <p className="text-purple-100 text-sm">Hoje restante</p>
                </div>
                <Calendar className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">32min</div>
                  <p className="text-orange-100 text-sm">Por consulta</p>
                </div>
                <Clock className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Consultas Semanais */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Consultas da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consultasSemanais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="consultas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Tipos de Consulta */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Activity className="h-5 w-5 text-green-600" />
                Tipos de Consulta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tiposConsulta}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="valor"
                      stroke="none"
                    >
                      {tiposConsulta.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border">
                              <p className="font-medium">{data.tipo}</p>
                              <p className="text-sm text-gray-600">{data.valor}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {tiposConsulta.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.cor }}
                    />
                    <span className="text-sm text-gray-600">{item.tipo}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pacientes Recentes */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Pacientes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pacientesRecentes.map((paciente) => (
                <div key={paciente.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {paciente.nome.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{paciente.nome}</h4>
                      <p className="text-sm text-gray-600">{paciente.idade} anos • {paciente.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{paciente.horario}</span>
                    <Badge 
                      variant={paciente.status === "Concluída" ? "default" : 
                               paciente.status === "Em andamento" ? "secondary" : "outline"}
                      className={
                        paciente.status === "Concluída" ? "bg-green-100 text-green-800 border-green-200" :
                        paciente.status === "Em andamento" ? "bg-blue-100 text-blue-800 border-blue-200" :
                        "bg-orange-100 text-orange-800 border-orange-200"
                      }
                    >
                      {paciente.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Notificações */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-sm">Paciente João Santos precisa de acompanhamento especial</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Lembrete: Reunião da equipe médica às 16:00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardMedico;
