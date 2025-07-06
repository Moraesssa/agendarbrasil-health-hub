
import { ArrowLeft, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Historico = () => {
  const navigate = useNavigate();

  const consultas = [
    {
      id: 1,
      data: "15/12/2024",
      medico: "Dr. Ana Silva",
      especialidade: "Cardiologia",
      diagnostico: "Consulta de rotina - Pressão arterial normal",
      status: "Concluída",
      receita: true,
      exames: ["Eletrocardiograma", "Hemograma completo"]
    },
    {
      id: 2,
      data: "28/11/2024",
      medico: "Dr. João Santos",
      especialidade: "Dermatologia",
      diagnostico: "Avaliação de lesão cutânea - Benigna",
      status: "Concluída",
      receita: false,
      exames: ["Dermatoscopia"]
    },
    {
      id: 3,
      data: "10/11/2024",
      medico: "Dra. Maria Costa",
      especialidade: "Endocrinologia",
      diagnostico: "Acompanhamento diabetes - Controlada",
      status: "Concluída",
      receita: true,
      exames: ["Glicemia", "Hemoglobina glicada"]
    }
  ];

  const exames = [
    {
      id: 1,
      nome: "Hemograma Completo",
      data: "15/12/2024",
      medico: "Dr. Ana Silva",
      status: "Disponível",
      resultado: "Normal"
    },
    {
      id: 2,
      nome: "Eletrocardiograma",
      data: "15/12/2024",
      medico: "Dr. Ana Silva",
      status: "Disponível",
      resultado: "Normal"
    },
    {
      id: 3,
      nome: "Glicemia",
      data: "10/11/2024",
      medico: "Dra. Maria Costa",
      status: "Disponível",
      resultado: "Alterado"
    }
  ];

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
          <h1 className="text-3xl font-bold text-blue-900">Histórico Médico</h1>
          <p className="text-gray-600">Suas consultas e exames anteriores</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Histórico de Consultas */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Consultas Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {consultas.map((consulta) => (
                <div key={consulta.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{consulta.medico}</h3>
                      <p className="text-sm text-gray-600">{consulta.especialidade}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {consulta.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{consulta.diagnostico}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{consulta.data}</span>
                    <div className="flex gap-2">
                      {consulta.receita && (
                        <Button size="sm" variant="outline" className="h-6 px-2">
                          <Download className="h-3 w-3 mr-1" />
                          Receita
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-6 px-2">
                        <Eye className="h-3 w-3 mr-1" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Resultados de Exames */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultados de Exames
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exames.map((exame) => (
                <div key={exame.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exame.nome}</h3>
                      <p className="text-sm text-gray-600">Solicitado por: {exame.medico}</p>
                    </div>
                    <Badge className={
                      exame.resultado === 'Normal' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }>
                      {exame.resultado}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{exame.data}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-6 px-2">
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 px-2">
                        <Eye className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Historico;
