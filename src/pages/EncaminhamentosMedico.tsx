
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ArrowRightLeft, Send, Inbox, Clock, CheckCircle, Plus, User, Calendar } from "lucide-react";
import { useEncaminhamentos } from "@/hooks/useEncaminhamentos";
import { NovoEncaminhamentoDialog } from "@/components/encaminhamentos/NovoEncaminhamentoDialog";
import { specialtyService } from "@/services/specialtyService";

const EncaminhamentosMedico = () => {
  const [novoEncaminhamentoOpen, setNovoEncaminhamentoOpen] = useState(false);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  
  const {
    encaminhamentosEnviados,
    encaminhamentosRecebidos,
    loading,
    atualizarEncaminhamento,
    carregarEncaminhamentos
  } = useEncaminhamentos();

  useEffect(() => {
    const carregarEspecialidades = async () => {
      try {
        const especialidadesData = await specialtyService.getAllSpecialties();
        setEspecialidades(especialidadesData);
      } catch (error) {
        console.error("Erro ao carregar especialidades:", error);
      }
    };
    carregarEspecialidades();
  }, []);

  const handleNovoEncaminhamento = () => {
    setNovoEncaminhamentoOpen(true);
  };

  const handleAceitarEncaminhamento = async (id: string, pacienteNome: string) => {
    await atualizarEncaminhamento(id, { status: 'aceito' });
  };

  const handleRejeitarEncaminhamento = async (id: string) => {
    await atualizarEncaminhamento(id, { status: 'rejeitado' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceito':
      case 'confirmado':
        return 'bg-green-100 text-green-700';
      case 'aguardando':
      case 'pendente':
        return 'bg-orange-100 text-orange-700';
      case 'rejeitado':
        return 'bg-red-100 text-red-700';
      case 'realizado':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aguardando':
        return 'Aguardando';
      case 'aceito':
        return 'Aceito';
      case 'rejeitado':
        return 'Rejeitado';
      case 'realizado':
        return 'Realizado';
      default:
        return status;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-blue-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50 transition-colors" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent">
                Encaminhamentos
              </h1>
              <p className="text-sm text-gray-600">Gerencie encaminhamentos entre especialistas</p>
            </div>
            <Button onClick={handleNovoEncaminhamento} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Encaminhamento
            </Button>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6 space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Send className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-gray-900">{encaminhamentosEnviados.length}</h3>
                    <p className="text-sm text-gray-600">Enviados</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Inbox className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-gray-900">{encaminhamentosRecebidos.length}</h3>
                    <p className="text-sm text-gray-600">Recebidos</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-gray-900">
                      {encaminhamentosEnviados.filter(e => e.status === "aguardando").length}
                    </h3>
                    <p className="text-sm text-gray-600">Aguardando</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-gray-900">
                      {encaminhamentosEnviados.filter(e => e.status === "aceito").length}
                    </h3>
                    <p className="text-sm text-gray-600">Confirmados</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="enviados" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="enviados" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Encaminhamentos Enviados
                  </TabsTrigger>
                  <TabsTrigger value="recebidos" className="flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    Encaminhamentos Recebidos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="enviados" className="space-y-4">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        Encaminhamentos Enviados
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {encaminhamentosEnviados.map((encaminhamento) => (
                        <Card key={encaminhamento.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-lg">{encaminhamento.paciente?.display_name || 'Paciente'}</h4>
                                <p className="text-gray-600">{encaminhamento.especialidade}</p>
                              </div>
                              <Badge 
                                variant={encaminhamento.status === "aceito" ? "default" : "secondary"}
                                className={getStatusColor(encaminhamento.status)}
                              >
                                {getStatusText(encaminhamento.status)}
                              </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>Para: {encaminhamento.medico_destino?.display_name || 'Especialista disponível'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{new Date(encaminhamento.data_encaminhamento).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm"><strong>Motivo:</strong> {encaminhamento.motivo}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recebidos" className="space-y-4">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-green-600" />
                        Encaminhamentos Recebidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {encaminhamentosRecebidos.map((encaminhamento) => (
                        <Card key={encaminhamento.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-lg">{encaminhamento.paciente?.display_name || 'Paciente'}</h4>
                                <p className="text-gray-600">De: {encaminhamento.medico_origem?.display_name || 'Médico'}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className={getStatusColor(encaminhamento.status)}>
                                  {getStatusText(encaminhamento.status)}
                                </Badge>
                                {encaminhamento.status === 'aguardando' && (
                                  <>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleAceitarEncaminhamento(encaminhamento.id, encaminhamento.paciente?.display_name || 'Paciente')}
                                    >
                                      Aceitar
                                    </Button>
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRejeitarEncaminhamento(encaminhamento.id)}
                                    >
                                      Rejeitar
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                                <span>Especialidade: {encaminhamento.especialidade}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{new Date(encaminhamento.data_encaminhamento).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm"><strong>Motivo:</strong> {encaminhamento.motivo}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Especialidades Disponíveis */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Especialidades Disponíveis para Encaminhamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {especialidades.map((especialidade) => (
                      <Badge key={especialidade} variant="outline" className="justify-center p-2">
                        {especialidade}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
      
      <NovoEncaminhamentoDialog
        open={novoEncaminhamentoOpen}
        onOpenChange={setNovoEncaminhamentoOpen}
        onSuccess={carregarEncaminhamentos}
      />
    </SidebarProvider>
  );
};

export default EncaminhamentosMedico;
