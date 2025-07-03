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

              <EspecialidadesDisponiveis especialidades={especialidades} />
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