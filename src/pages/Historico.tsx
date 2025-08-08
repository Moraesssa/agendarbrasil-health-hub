
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorHistory } from "@/hooks/useDoctorHistory";

const Historico = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filtros
  const [type, setType] = useState<'all' | 'consultas' | 'exames'>('all');
  const [period, setPeriod] = useState<'30' | '90' | '180'>('90');
  const [status, setStatus] = useState<string>('all');
  const [patientQuery, setPatientQuery] = useState('');

  const { consultas: rawConsultas, exames: rawExames, loading } = useDoctorHistory(user?.id);

  useEffect(() => {
    document.title = 'Histórico Médico | Portal Médico';
  }, []);

  const startDate = useMemo(() => {
    const days = parseInt(period, 10);
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [period]);

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('pt-BR') : '-';

  // Adapta os dados reais para o formato existente no UI
  const consultas = useMemo(() => {
    return (rawConsultas || [])
      .filter((c) => {
        const when = c.consultation_date ? new Date(c.consultation_date) : null;
        return when ? when >= startDate : true;
      })
      .filter((c) => (status === 'all' ? true : (c.status || '').toLowerCase() === status.toLowerCase()))
      .filter((c) =>
        patientQuery ? (c.patient_name || '').toLowerCase().includes(patientQuery.toLowerCase()) : true
      )
      .map((c) => ({
        id: c.id,
        data: formatDate(c.consultation_date),
        medico: c.patient_name, // No portal médico, exibimos o paciente
        especialidade: c.consultation_type || 'Consulta',
        diagnostico: c.notes || '—',
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Concluída',
        receita: false,
        exames: [] as string[],
      }));
  }, [rawConsultas, startDate, status, patientQuery]);

  const exames = useMemo(() => {
    return (rawExames || [])
      .filter((e) => {
        const ref = e.completed_date || e.scheduled_date;
        return ref ? new Date(ref) >= startDate : true;
      })
      .filter((e) => (status === 'all' ? true : (e.status || '').toLowerCase() === status.toLowerCase()))
      .map((e) => {
        const resultado = e.results_summary || (e.results_available ? 'Normal' : 'Pendente');
        return {
          id: e.id,
          nome: e.exam_name,
          data: formatDate(e.completed_date || e.scheduled_date),
          medico: e.healthcare_provider || '—',
          status: e.results_available ? 'Disponível' : 'Pendente',
          resultado,
        };
      });
  }, [rawExames, startDate, status]);

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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="consultas">Consultas</SelectItem>
                <SelectItem value="exames">Exames</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="pending_results">Pending Results</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Buscar por paciente"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Histórico de Consultas */}
          {(type === 'all' || type === 'consultas') && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Consultas Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && consultas.length === 0 ? (
                  <p className="text-sm text-gray-600">Carregando...</p>
                ) : consultas.length === 0 ? (
                  <p className="text-sm text-gray-600">Nenhuma consulta encontrada no período.</p>
                ) : (
                  consultas.map((consulta) => (
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
                          <Button size="sm" variant="outline" className="h-6 px-2">
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultados de Exames */}
          {(type === 'all' || type === 'exames') && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resultados de Exames
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && exames.length === 0 ? (
                  <p className="text-sm text-gray-600">Carregando...</p>
                ) : exames.length === 0 ? (
                  <p className="text-sm text-gray-600">Nenhum exame encontrado no período.</p>
                ) : (
                  exames.map((exame) => (
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
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Historico;
