
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DadosProfissionaisFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

export const DadosProfissionaisForm = ({ onNext, initialData }: DadosProfissionaisFormProps) => {
  const [formData, setFormData] = useState({
    crm: initialData?.crm || '',
    especialidades: initialData?.especialidades || [''],
    telefone: initialData?.telefone || '',
    whatsapp: initialData?.whatsapp || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      crm: formData.crm,
      especialidades: formData.especialidades.filter(e => e.trim()),
      telefone: formData.telefone,
      whatsapp: formData.whatsapp || null
    });
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

  const removeEspecialidade = (index: number) => {
    if (formData.especialidades.length > 1) {
      const newEspecialidades = formData.especialidades.filter((_, i) => i !== index);
      setFormData({ ...formData, especialidades: newEspecialidades });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Profissionais</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <Input
              id="crm"
              value={formData.crm}
              onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
              placeholder="Ex: 123456/SP"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Especialidades</Label>
            {formData.especialidades.map((esp, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={esp}
                  onChange={(e) => handleEspecialidadeChange(index, e.target.value)}
                  placeholder="Digite uma especialidade"
                  required
                />
                {formData.especialidades.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => removeEspecialidade(index)}
                  >
                    Remover
                  </Button>
                )}
              </div>
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

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <Button type="submit" className="w-full">
            Próximo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
