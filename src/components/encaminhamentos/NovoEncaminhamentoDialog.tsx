import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { encaminhamentoService } from "@/services/encaminhamentoService";
import { specialtyService } from "@/services/specialtyService";

interface NovoEncaminhamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefillEspecialidade?: string;
  prefillMedico?: { id: string; display_name: string };
}

export const NovoEncaminhamentoDialog = ({ open, onOpenChange, onSuccess, prefillEspecialidade, prefillMedico }: NovoEncaminhamentoDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [medicos, setMedicos] = useState<Array<{id: string, display_name: string}>>([]);
  const [formData, setFormData] = useState({
    paciente_nome: "",
    paciente_cpf: "",
    especialidade: "",
    medico_destino_id: "",
    motivo: "",
    observacoes: ""
  });

  useEffect(() => {
    const carregarEspecialidades = async () => {
      try {
        const especialidadesData = await specialtyService.getAllSpecialties();
        setEspecialidades(especialidadesData);
      } catch (error) {
        console.error("Erro ao carregar especialidades:", error);
      }
    };

    if (open) {
      carregarEspecialidades();
    }
  }, [open]);

  useEffect(() => {
    const carregarMedicos = async () => {
      if (formData.especialidade) {
        try {
          const medicosData = await encaminhamentoService.getMedicosPorEspecialidade(formData.especialidade);
          setMedicos(medicosData);
        } catch (error) {
          console.error("Erro ao carregar médicos:", error);
          setMedicos([]);
        }
      } else {
        setMedicos([]);
      }
    };

    carregarMedicos();
  }, [formData.especialidade]);

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        especialidade: prefillEspecialidade || prev.especialidade,
        medico_destino_id: prefillMedico?.id || (prefillEspecialidade ? "" : prev.medico_destino_id)
      }));
    }
  }, [open, prefillEspecialidade, prefillMedico]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.especialidade || !formData.motivo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Por enquanto, vamos criar um paciente temporário ou buscar por CPF
      // Em uma implementação completa, haveria uma busca de pacientes
      const pacienteId = "temp-patient-id"; // Substituir por lógica real de busca de paciente

      const result = await encaminhamentoService.criarEncaminhamento({
        paciente_id: pacienteId,
        especialidade: formData.especialidade,
        motivo: formData.motivo,
        observacoes: formData.observacoes || undefined,
        medico_destino_id: formData.medico_destino_id || undefined
      });

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Encaminhamento criado com sucesso"
        });
        setFormData({
          paciente_nome: "",
          paciente_cpf: "",
          especialidade: "",
          medico_destino_id: "",
          motivo: "",
          observacoes: ""
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: result.error?.message || "Erro ao criar encaminhamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar encaminhamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Encaminhamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paciente_nome">Nome do Paciente *</Label>
            <Input
              id="paciente_nome"
              value={formData.paciente_nome}
              onChange={(e) => setFormData(prev => ({ ...prev, paciente_nome: e.target.value }))}
              placeholder="Digite o nome do paciente"
              required
            />
          </div>


          {prefillEspecialidade ? (
            <div className="space-y-2" aria-live="polite">
              <Label>Resumo da Seleção</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" aria-label={`Especialidade selecionada: ${prefillEspecialidade}`}>
                  {prefillEspecialidade}
                </Badge>
                {prefillMedico && (
                  <Badge variant="outline" aria-label={`Médico selecionado: ${prefillMedico.display_name}`}>
                    {prefillMedico.display_name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Você já selecionou a especialidade{prefillMedico ? " e o médico." : "."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade *</Label>
              <Select 
                value={formData.especialidade} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, especialidade: value, medico_destino_id: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((especialidade) => (
                    <SelectItem key={especialidade} value={especialidade}>
                      {especialidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {medicos.length > 0 && !prefillEspecialidade && (
            <div className="space-y-2">
              <Label htmlFor="medico_destino">Médico Específico (Opcional)</Label>
              <Select 
                value={formData.medico_destino_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, medico_destino_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um médico específico ou deixe em branco" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((medico) => (
                    <SelectItem key={medico.id} value={medico.id}>
                      {medico.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do Encaminhamento *</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Descreva o motivo do encaminhamento"
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais (opcional)"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Criando..." : "Criar Encaminhamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};