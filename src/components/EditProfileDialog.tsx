
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, Loader2 } from "lucide-react";
import { DadosProfissionaisForm } from "@/components/onboarding/forms/DadosProfissionaisForm";
import { EnderecoForm } from "@/components/onboarding/forms/EnderecoForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BaseUser } from "@/types/user";

interface EditProfileDialogProps {
  userData: BaseUser;
  onProfileUpdate: () => void;
}

export const EditProfileDialog = ({ userData, onProfileUpdate }: EditProfileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dados-profissionais");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dadosProfissionais: {},
    endereco: {}
  });
  const { toast } = useToast();

  const handleFormNext = (tabKey: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [tabKey]: data
    }));

    // Move to next tab or save if it's the last tab
    if (tabKey === "dados-profissionais") {
      setActiveTab("endereco");
    } else if (tabKey === "endereco") {
      handleSave();
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update profiles table
      const profileUpdates: any = {};
      
      if (formData.dadosProfissionais) {
        const dadosProf = formData.dadosProfissionais as any;
        if (dadosProf.telefone) {
          // We can update display_name if nomeCompleto is provided in dados profissionais
          if (dadosProf.dadosProfissionais?.nomeCompleto) {
            profileUpdates.display_name = dadosProf.dadosProfissionais.nomeCompleto;
          }
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
      
      if (formData.dadosProfissionais) {
        const dadosProf = formData.dadosProfissionais as any;
        if (dadosProf.crm) medicosUpdates.crm = dadosProf.crm;
        if (dadosProf.especialidades) medicosUpdates.especialidades = dadosProf.especialidades;
        if (dadosProf.telefone) medicosUpdates.telefone = dadosProf.telefone;
        if (dadosProf.whatsapp) medicosUpdates.whatsapp = dadosProf.whatsapp;
        if (dadosProf.dadosProfissionais) {
          medicosUpdates.dados_profissionais = dadosProf.dadosProfissionais;
        }
      }

      if (formData.endereco) {
        medicosUpdates.endereco = formData.endereco;
      }

      if (Object.keys(medicosUpdates).length > 0) {
        const { error: medicoError } = await supabase
          .from('medicos')
          .update(medicosUpdates)
          .eq('user_id', userData.uid);

        if (medicoError) throw medicoError;
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });

      setOpen(false);
      setActiveTab("dados-profissionais");
      setFormData({ dadosProfissionais: {}, endereco: {} });
      onProfileUpdate();

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
                especialidades: userData.especialidades,
                telefone: "", // Will be loaded from medicos table
                whatsapp: ""   // Will be loaded from medicos table
              }}
            />
          </TabsContent>

          <TabsContent value="endereco" className="mt-6">
            <EnderecoForm
              onNext={(data) => handleFormNext("endereco", data)}
              initialData={{}}
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
