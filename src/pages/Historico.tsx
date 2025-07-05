
import { ArrowLeft, FileText, Download, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useHistory } from "@/hooks/useHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import HealthSummary from "@/components/HealthSummary";
import { useHealthMetrics } from "@/hooks/useHealthMetrics";
import { useAuth } from "@/contexts/AuthContext";
 
 const Historico = () => {
  console.log(`[Historico Page] Re-rendering at ${new Date().toISOString()}`);
   const navigate = useNavigate();
   const { user } = useAuth();
   const { data, isLoading: isLoadingHistory, error: historyError } = useHistory();
   const { summaryData, isLoading: isLoadingMetrics, error: metricsError } = useHealthMetrics(user?.id || '');
   const { consultas, exames } = data;
 
   const renderConsultaSkeleton = () => (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );

  const renderExameSkeleton = () => (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Histórico Médico</h1>
              <p className="text-gray-600">Suas consultas e exames anteriores</p>
            </div>
            <Button onClick={() => navigate('/adicionar-metrica')}>
              Adicionar Métrica
            </Button>
          </div>
        </div>

        {(historyError || metricsError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Dados</AlertTitle>
            <AlertDescription>{historyError || metricsError?.message}</AlertDescription>
          </Alert>
        )}
 
        <div className="mb-8">
          {isLoadingMetrics ? (
            <Skeleton className="h-80 w-full rounded-lg" />
          ) : summaryData ? (
            <HealthSummary {...summaryData} />
          ) : null}
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
              {isLoadingHistory ? (
                Array.from({ length: 3 }).map((_, index) => <div key={index}>{renderConsultaSkeleton()}</div>)
              ) : consultas.length > 0 ? (
                consultas.map((consulta) => (
                  <div key={consulta.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{consulta.medico}</h3>
                        <p className="text-sm text-gray-600">{consulta.especialidade}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 capitalize">
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
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhuma consulta encontrada.</p>
              )}
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
              {isLoadingHistory ? (
                Array.from({ length: 3 }).map((_, index) => <div key={index}>{renderExameSkeleton()}</div>)
              ) : exames.length > 0 ? (
                exames.map((exame) => (
                  <div key={exame.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exame.nome}</h3>
                        <p className="text-sm text-gray-600">Solicitado por: {exame.medico}</p>
                      </div>
                      <Badge className={
                        exame.resultado?.toLowerCase() === 'normal'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }>
                        {exame.resultado || 'Pendente'}
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
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhum exame encontrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Historico;
