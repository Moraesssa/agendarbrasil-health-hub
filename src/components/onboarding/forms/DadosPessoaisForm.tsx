
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateCPF, validatePhone, validateCRM, sanitizeInput, validateDate } from "@/utils/validation";
import { useToast } from "@/hooks/use-toast";

interface DadosPessoaisFormProps {
  onNext: (data: any) => void;
  initialData?: any;
  isMedico?: boolean;
}

export const DadosPessoaisForm = ({ onNext, initialData, isMedico = false }: DadosPessoaisFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nomeCompleto: initialData?.nomeCompleto || '',
    cpf: initialData?.cpf || '',
    dataNascimento: initialData?.dataNascimento || '',
    telefone: initialData?.telefone || '',
    ...(isMedico && {
      crm: initialData?.crm || '',
      especialidades: Array.isArray(initialData?.especialidades) ? initialData.especialidades : ['']
    })
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate nome
    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = "Nome completo é obrigatório";
    } else if (formData.nomeCompleto.length < 2) {
      newErrors.nomeCompleto = "Nome deve ter pelo menos 2 caracteres";
    }
    
    // Validate CPF
    if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }
    
    // Validate date
    if (!validateDate(formData.dataNascimento)) {
      newErrors.dataNascimento = "Data de nascimento inválida";
    }
    
    // Validate phone
    if (!validatePhone(formData.telefone)) {
      newErrors.telefone = "Telefone inválido";
    }
    
    // Validate CRM for doctors
    if (isMedico && !validateCRM(formData.crm)) {
      newErrors.crm = "CRM inválido";
    }
    
    // Validate specialties for doctors
    if (isMedico) {
      const especialidades = Array.isArray(formData.especialidades) ? formData.especialidades : [];
      const validEspecialidades = especialidades.filter(e => e && e.trim());
      if (validEspecialidades.length === 0) {
        newErrors.especialidades = "Pelo menos uma especialidade é obrigatória";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro na validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }
    
    // Sanitize inputs
    const sanitizedData = {
      nomeCompleto: sanitizeInput(formData.nomeCompleto),
      cpf: formData.cpf.replace(/[^\d]/g, ''),
      dataNascimento: formData.dataNascimento,
      telefone: formData.telefone.replace(/[^\d]/g, ''),
      ...(isMedico && {
        crm: sanitizeInput(formData.crm),
        especialidades: Array.isArray(formData.especialidades) 
          ? formData.especialidades.map(e => sanitizeInput(e)).filter(e => e.trim())
          : []
      })
    };
    
    if (isMedico) {
      onNext({
        crm: sanitizedData.crm,
        especialidades: sanitizedData.especialidades,
        telefone: sanitizedData.telefone,
        dadosProfissionais: {
          nomeCompleto: sanitizedData.nomeCompleto,
          cpf: sanitizedData.cpf,
          dataNascimento: new Date(sanitizedData.dataNascimento)
        }
      });
    } else {
      onNext({
        dadosPessoais: {
          nomeCompleto: sanitizedData.nomeCompleto,
          cpf: sanitizedData.cpf,
          dataNascimento: new Date(sanitizedData.dataNascimento)
        },
        contato: {
          telefone: sanitizedData.telefone
        }
      });
    }
  };

  const handleEspecialidadeChange = (index: number, value: string) => {
    const especialidades = Array.isArray(formData.especialidades) ? formData.especialidades : [''];
    const newEspecialidades = [...especialidades];
    newEspecialidades[index] = value;
    setFormData({ ...formData, especialidades: newEspecialidades });
  };

  const addEspecialidade = () => {
    const especialidades = Array.isArray(formData.especialidades) ? formData.especialidades : [''];
    setFormData({ 
      ...formData, 
      especialidades: [...especialidades, ''] 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isMedico ? 'Dados Profissionais' : 'Dados Pessoais'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome Completo</Label>
            <Input
              id="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={(e) => {
                setFormData({ ...formData, nomeCompleto: e.target.value });
                if (errors.nomeCompleto) setErrors({ ...errors, nomeCompleto: '' });
              }}
              className={errors.nomeCompleto ? "border-destructive" : ""}
              required
            />
            {errors.nomeCompleto && (
              <p className="text-sm text-destructive">{errors.nomeCompleto}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => {
                setFormData({ ...formData, cpf: e.target.value });
                if (errors.cpf) setErrors({ ...errors, cpf: '' });
              }}
              className={errors.cpf ? "border-destructive" : ""}
              placeholder="000.000.000-00"
              required
            />
            {errors.cpf && (
              <p className="text-sm text-destructive">{errors.cpf}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de Nascimento</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => {
                setFormData({ ...formData, telefone: e.target.value });
                if (errors.telefone) setErrors({ ...errors, telefone: '' });
              }}
              className={errors.telefone ? "border-destructive" : ""}
              placeholder="(11) 99999-9999"
              required
            />
            {errors.telefone && (
              <p className="text-sm text-destructive">{errors.telefone}</p>
            )}
          </div>

          {isMedico && (
            <>
              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <Input
                  id="crm"
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Especialidades</Label>
                {(Array.isArray(formData.especialidades) ? formData.especialidades : ['']).map((esp, index) => (
                  <Input
                    key={index}
                    value={esp}
                    onChange={(e) => handleEspecialidadeChange(index, e.target.value)}
                    placeholder="Digite uma especialidade"
                  />
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addEspecialidade}
                  className="w-full"
                >
                  Adicionar Especialidade
                </Button>
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            Próximo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
