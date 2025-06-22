
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DadosPessoaisFormProps {
  onNext: (data: any) => void;
  initialData?: any;
  isMedico?: boolean;
}

export const DadosPessoaisForm = ({ onNext, initialData, isMedico = false }: DadosPessoaisFormProps) => {
  const [formData, setFormData] = useState({
    nomeCompleto: initialData?.nomeCompleto || '',
    cpf: initialData?.cpf || '',
    dataNascimento: initialData?.dataNascimento || '',
    telefone: initialData?.telefone || '',
    ...(isMedico && {
      crm: initialData?.crm || '',
      especialidades: initialData?.especialidades || ['']
    })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isMedico) {
      onNext({
        crm: formData.crm,
        especialidades: formData.especialidades.filter(e => e.trim()),
        telefone: formData.telefone,
        dadosProfissionais: {
          nomeCompleto: formData.nomeCompleto,
          cpf: formData.cpf,
          dataNascimento: new Date(formData.dataNascimento)
        }
      });
    } else {
      onNext({
        dadosPessoais: {
          nomeCompleto: formData.nomeCompleto,
          cpf: formData.cpf,
          dataNascimento: new Date(formData.dataNascimento)
        },
        contato: {
          telefone: formData.telefone
        }
      });
    }
  };

  const handleEspecialidadeChange = (index: number, value: string) => {
    const newEspecialidades = [...formData.especialidades];
    newEspecialidades[index] = value;
    setFormData({ ...formData, especialidades: newEspecialidades });
  };

  const addEspecialidade = () => {
    setFormData({ 
      ...formData, 
      especialidades: [...formData.especialidades, ''] 
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
              onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              required
            />
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
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
            />
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
                {formData.especialidades.map((esp, index) => (
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
