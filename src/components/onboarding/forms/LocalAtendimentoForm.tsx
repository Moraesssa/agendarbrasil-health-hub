import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import locationService, { LocalAtendimento } from "@/services/locationService";
import {
  sanitizeInput,
  validateCEP,
  validatePhone,
  validateUF,
} from "@/utils/validation";

interface LocalAtendimentoFormProps {
  onNext: (data: any) => void;
  initialData?: any;
  enderecoBase?: any;
  existingLocations?: Array<Partial<LocalAtendimento>>;
}

interface FormState {
  nome_local: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

const buildInitialState = (initialData?: any, enderecoBase?: any): FormState => {
  const endereco = initialData?.endereco || enderecoBase || {};
  return {
    nome_local: initialData?.nome_local || "",
    telefone: initialData?.telefone || "",
    cep: endereco?.cep || "",
    logradouro: endereco?.logradouro || "",
    numero: endereco?.numero || "",
    complemento: endereco?.complemento || "",
    bairro: endereco?.bairro || "",
    cidade: endereco?.cidade || "",
    uf: endereco?.uf || "",
  };
};

export const LocalAtendimentoForm = ({
  onNext,
  initialData,
  enderecoBase,
  existingLocations,
}: LocalAtendimentoFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormState>(
    buildInitialState(initialData, enderecoBase)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome_local.trim()) {
      newErrors.nome_local = "Nome do local é obrigatório";
    }
    if (!validateCEP(formData.cep)) {
      newErrors.cep = "CEP deve ter formato válido (00000-000)";
    }
    if (!formData.logradouro.trim()) {
      newErrors.logradouro = "Logradouro é obrigatório";
    }
    if (!formData.numero.trim()) {
      newErrors.numero = "Número é obrigatório";
    }
    if (!formData.bairro.trim()) {
      newErrors.bairro = "Bairro é obrigatório";
    }
    if (!formData.cidade.trim()) {
      newErrors.cidade = "Cidade é obrigatória";
    }
    if (!validateUF(formData.uf)) {
      newErrors.uf = "UF deve ser válida";
    }
    if (formData.telefone && !validatePhone(formData.telefone)) {
      newErrors.telefone = "Telefone deve ter formato válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive",
      });
      return;
    }

    const payload: Omit<LocalAtendimento, "id" | "ativo" | "medico_id"> = {
      nome_local: sanitizeInput(formData.nome_local),
      endereco: {
        cep: sanitizeInput(formData.cep),
        logradouro: sanitizeInput(formData.logradouro),
        numero: sanitizeInput(formData.numero),
        complemento: sanitizeInput(formData.complemento),
        bairro: sanitizeInput(formData.bairro),
        cidade: sanitizeInput(formData.cidade),
        uf: sanitizeInput(formData.uf.toUpperCase()),
      },
    };

    if (formData.telefone) {
      payload.telefone = sanitizeInput(formData.telefone);
    }

    try {
      setIsSaving(true);
      await locationService.addLocation(payload);
      toast({
        title: "Local cadastrado",
        description: "Seu local de atendimento foi salvo com sucesso",
      });
      const listaExistente = Array.isArray(existingLocations)
        ? existingLocations
        : [];
      const listaAtualizada = listaExistente.filter((item) => {
        if (!item?.nome_local || !item?.endereco?.cep) {
          return false;
        }
        const mesmoNome = item.nome_local === payload.nome_local;
        const mesmoCep = item.endereco?.cep === payload.endereco.cep;
        return !(mesmoNome && mesmoCep);
      });
      onNext({
        localAtendimento: payload,
        locaisAtendimento: [...listaAtualizada, payload],
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar local",
        description: error?.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Local de Atendimento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_local">Nome do local</Label>
            <Input
              id="nome_local"
              value={formData.nome_local}
              onChange={(event) =>
                setFormData({ ...formData, nome_local: sanitizeInput(event.target.value) })
              }
              className={errors.nome_local ? "border-red-500" : ""}
              data-testid="nome-local-input"
              required
            />
            {errors.nome_local && (
              <p className="text-sm text-red-500 mt-1">{errors.nome_local}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone_local">Telefone (opcional)</Label>
            <Input
              id="telefone_local"
              value={formData.telefone}
              onChange={(event) =>
                setFormData({ ...formData, telefone: sanitizeInput(event.target.value) })
              }
              className={errors.telefone ? "border-red-500" : ""}
              data-testid="telefone-local-input"
            />
            {errors.telefone && (
              <p className="text-sm text-red-500 mt-1">{errors.telefone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep_local">CEP</Label>
            <Input
              id="cep_local"
              value={formData.cep}
              onChange={(event) =>
                setFormData({ ...formData, cep: sanitizeInput(event.target.value) })
              }
              className={errors.cep ? "border-red-500" : ""}
              data-testid="cep-local-input"
              required
            />
            {errors.cep && (
              <p className="text-sm text-red-500 mt-1">{errors.cep}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logradouro_local">Logradouro</Label>
            <Input
              id="logradouro_local"
              value={formData.logradouro}
              onChange={(event) =>
                setFormData({ ...formData, logradouro: sanitizeInput(event.target.value) })
              }
              className={errors.logradouro ? "border-red-500" : ""}
              data-testid="logradouro-local-input"
              required
            />
            {errors.logradouro && (
              <p className="text-sm text-red-500 mt-1">{errors.logradouro}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_local">Número</Label>
              <Input
                id="numero_local"
                value={formData.numero}
                onChange={(event) =>
                  setFormData({ ...formData, numero: sanitizeInput(event.target.value) })
                }
                className={errors.numero ? "border-red-500" : ""}
                data-testid="numero-local-input"
                required
              />
              {errors.numero && (
                <p className="text-sm text-red-500 mt-1">{errors.numero}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento_local">Complemento</Label>
              <Input
                id="complemento_local"
                value={formData.complemento}
                onChange={(event) =>
                  setFormData({ ...formData, complemento: sanitizeInput(event.target.value) })
                }
                data-testid="complemento-local-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro_local">Bairro</Label>
            <Input
              id="bairro_local"
              value={formData.bairro}
              onChange={(event) =>
                setFormData({ ...formData, bairro: sanitizeInput(event.target.value) })
              }
              className={errors.bairro ? "border-red-500" : ""}
              data-testid="bairro-local-input"
              required
            />
            {errors.bairro && (
              <p className="text-sm text-red-500 mt-1">{errors.bairro}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="cidade_local">Cidade</Label>
              <Input
                id="cidade_local"
                value={formData.cidade}
                onChange={(event) =>
                  setFormData({ ...formData, cidade: sanitizeInput(event.target.value) })
                }
                className={errors.cidade ? "border-red-500" : ""}
                data-testid="cidade-local-input"
                required
              />
              {errors.cidade && (
                <p className="text-sm text-red-500 mt-1">{errors.cidade}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf_local">UF</Label>
              <Input
                id="uf_local"
                value={formData.uf}
                maxLength={2}
                onChange={(event) =>
                  setFormData({ ...formData, uf: sanitizeInput(event.target.value.toUpperCase()) })
                }
                className={errors.uf ? "border-red-500" : ""}
                data-testid="uf-local-input"
                required
              />
              {errors.uf && (
                <p className="text-sm text-red-500 mt-1">{errors.uf}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            data-testid="form-step-3-next"
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Próximo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
