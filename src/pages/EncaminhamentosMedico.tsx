
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Send, Inbox, Plus } from "lucide-react";
import { useEncaminhamentos } from "@/hooks/useEncaminhamentos";
import { NovoEncaminhamentoDialog } from "@/components/encaminhamentos/NovoEncaminhamentoDialog";
import { EncaminhamentosStats } from "@/components/encaminhamentos/EncaminhamentosStats";
import { EncaminhamentosEnviadosTab } from "@/components/encaminhamentos/EncaminhamentosEnviadosTab";
import { EncaminhamentosRecebidosTab } from "@/components/encaminhamentos/EncaminhamentosRecebidosTab";
import { EspecialidadesDisponiveis } from "@/components/encaminhamentos/EspecialidadesDisponiveis";
import { ResultadoBuscaMedicos } from "@/components/encaminhamentos/ResultadoBuscaMedicos";
import { specialtyService } from "@/services/specialtyService";
import { useToast } from "@/hooks/use-toast";

interface Medico {
  id: string;
  display_name: string;
}

const EncaminhamentosMedico = () => {
  const [novoEncaminhamentoOpen, setNovoEncaminhamentoOpen] = useState(false);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [searchingEspecialidade, setSearchingEspecialidade] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultadoBusca, setResultadoBusca] = useState<{
    especialidade: string;
    medicos: Medico[];
    visible: boolean;
  }>({
    especialidade: "",
    medicos: [],
    visible: false
  });
  
  const { toast } = useToast();
  
  const {
    encaminhamentosEnviados,
    encaminhamentosRecebidos,
    loading,
    atualizarEncaminhamento,
    carregarEncaminhamentos,
    buscarMedicosPorEspecialidade
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

  const handleEspecialidadeClick = async (especialidade: string) => {
    setIsSearching(true);
    setSearchingEspecialidade(especialidade);
    setResultadoBusca(prev => ({ ...prev, visible: false }));

    try {
      const medicos = await buscarMedicosPorEspecialidade(especialidade);
      
      setResultadoBusca({
        especialidade,
        medicos,
        visible: true
      });

      // Toast informativo sobre o resultado
      if (medicos.length > 0) {
        toast({
          title: "Busca concluída",
          description: `${medicos.length} médico(s) encontrado(s) para ${especialidade}`,
        });
      } else {
        toast({
          title: "Nenhum médico encontrado",
          description: `Não há médicos disponíveis para ${especialidade}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao buscar médicos:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar médicos para esta especialidade",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
      setSearchingEspecialidade("");
    }
  };

  const handleSelecionarMedico = (medico: Medico, especialidade: string) => {
    // Fechar resultado da busca
    setResultadoBusca(prev => ({ ...prev, visible: false }));
    
    // Abrir dialog de novo encaminhamento com dados pré-preenchidos
    setNovoEncaminhamentoOpen(true);
    
    toast({
      title: "Médico selecionado",
      description: `${medico.display_name} selecionado para ${especialidade}`,
    });
  };

  const handleCloseResultado = () => {
    setResultadoBusca(prev => ({ ...prev, visible: false }));
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
              <EncaminhamentosStats 
                encaminhamentosEnviados={encaminhamentosEnviados}
                encaminhamentosRecebidos={encaminhamentosRecebidos}
              />

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
                  <EncaminhamentosEnviadosTab 
                    encaminhamentosEnviados={encaminhamentosEnviados}
                  />
                </TabsContent>

                <TabsContent value="recebidos" className="space-y-4">
                  <EncaminhamentosRecebidosTab 
                    encaminhamentosRecebidos={encaminhamentosRecebidos}
                    onAceitar={handleAceitarEncaminhamento}
                    onRejeitar={handleRejeitarEncaminhamento}
                  />
                </TabsContent>
              </Tabs>

              {/* Resultado da busca de médicos */}
              {resultadoBusca.visible && (
                <ResultadoBuscaMedicos
                  especialidade={resultadoBusca.especialidade}
                  medicos={resultadoBusca.medicos}
                  isVisible={resultadoBusca.visible}
                  onClose={handleCloseResultado}
                  onSelecionarMedico={handleSelecionarMedico}
                />
              )}

              <EspecialidadesDisponiveis 
                especialidades={especialidades}
                onEspecialidadeClick={handleEspecialidadeClick}
                isSearching={isSearching}
                searchingEspecialidade={searchingEspecialidade}
              />
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
