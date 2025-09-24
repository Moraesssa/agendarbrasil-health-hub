
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Loader2 } from "lucide-react";
import { DadosProfissionaisForm } from "@/components/onboarding/forms/DadosProfissionaisForm";
import { EnderecoForm } from "@/components/onboarding/forms/EnderecoForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BaseUser } from "@/types/user";

type DadosProfissionaisState = Partial<{
  crm: string;
  especialidades: string[];
  telefone: string;
  whatsapp: string | null;
  dadosProfissionais: {
    nomeCompleto?: string;
    [key: string]: unknown;
  };
}> & Record<string, unknown>;

type EnderecoState = Partial<{
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}> & Record<string, unknown>;

type FormState = {
  dadosProfissionais: DadosProfissionaisState;
  endereco: EnderecoState;
};

interface EditProfileDialogProps {
  userData: BaseUser;
  onProfileUpdate: () => Promise<void>;
}

export const EditProfileDialog = ({ userData, onProfileUpdate }: EditProfileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dados-profissionais");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    dadosProfissionais: {},
    endereco: {}
  });
  const { toast } = useToast();

  const handleFormNext = (
    tabKey: "dados-profissionais" | "endereco",
    data: DadosProfissionaisState | { endereco: EnderecoState }
  ) => {
    if (tabKey === "dados-profissionais") {
      setFormData(prev => ({
        ...prev,
        dadosProfissionais: data as DadosProfissionaisState
      }));
      setActiveTab("endereco");
      return;
    }

    const enderecoData = "endereco" in data ? data.endereco as EnderecoState : (data as EnderecoState);

    setFormData(prev => ({
      ...prev,
      endereco: enderecoData
    }));

    handleSave({ endereco: enderecoData });
  };

  const handleSave = async (overrideData?: Partial<FormState>) => {
    setIsLoading(true);
    try {
      const currentDadosProfissionais = overrideData?.dadosProfissionais ?? formData.dadosProfissionais;
      const currentEndereco = overrideData?.endereco ?? formData.endereco;

      // Update profiles table
      const profileUpdates: any = {};

      if (currentDadosProfissionais) {
        const dadosProf = currentDadosProfissionais as any;

        if (dadosProf?.dadosProfissionais?.nomeCompleto) {
          profileUpdates.display_name = dadosProf.dadosProfissionais.nomeCompleto;
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userData.uid);

        if (profileError) throw profileError;
      }

      // Update medicos table
      const medicosUpdates: any = {};
      
      if (currentDadosProfissionais) {
        const dadosProf = currentDadosProfissionais as any;

        if (dadosProf && 'crm' in dadosProf) {
          medicosUpdates.crm = dadosProf.crm;
        }

        if (dadosProf && 'especialidades' in dadosProf) {
          medicosUpdates.especialidades = dadosProf.especialidades;
        }

        if (dadosProf && 'telefone' in dadosProf) {
          medicosUpdates.telefone = dadosProf.telefone;
        }

        if (dadosProf && 'whatsapp' in dadosProf) {
          medicosUpdates.whatsapp = dadosProf.whatsapp;
        }

        if (dadosProf?.dadosProfissionais) {
          medicosUpdates.dados_profissionais = dadosProf.dadosProfissionais;
        }
      }

      if (currentEndereco && Object.keys(currentEndereco).length > 0) {
        medicosUpdates.endereco = currentEndereco;
      }

      if (Object.keys(medicosUpdates).length > 0) {
        const { error: medicoError } = await supabase
          .from('medicos')
          .update(medicosUpdates)
          .eq('user_id', userData.uid);

        if (medicoError) throw medicoError;
      }

      await onProfileUpdate();

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      setOpen(false);
      setActiveTab("dados-profissionais");
      setFormData({ dadosProfissionais: {}, endereco: {} });

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
          <Edit className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Perfil Médico
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados-profissionais">Dados Profissionais</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
          </TabsList>

          <TabsContent value="dados-profissionais" className="mt-6">
            <DadosProfissionaisForm
              onNext={(data) => handleFormNext("dados-profissionais", data)}
              initialData={{
                crm: userData.crm,
                especialidades: Array.isArray(userData.especialidades) ? userData.especialidades : [],
                telefone: userData.telefone ?? "",
                whatsapp: userData.whatsapp ?? ""
              }}
            />
          </TabsContent>

          <TabsContent value="endereco" className="mt-6">
            <EnderecoForm
              onNext={(data) => handleFormNext("endereco", data)}
              initialData={userData.endereco ?? {}}
            />
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Salvando alterações...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
