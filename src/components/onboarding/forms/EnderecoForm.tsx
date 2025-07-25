
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateCEP, validateUF, sanitizeInput, checkRateLimit, createSecureErrorResponse } from "@/utils/validation";
import { useToast } from "@/hooks/use-toast";

interface EnderecoFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

export const EnderecoForm = ({ onNext, initialData }: EnderecoFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    cep: initialData?.cep || '',
    logradouro: initialData?.logradouro || '',
    numero: initialData?.numero || '',
    complemento: initialData?.complemento || '',
    bairro: initialData?.bairro || '',
    cidade: initialData?.cidade || '',
    uf: initialData?.uf || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateCEP(formData.cep)) {
      newErrors.cep = 'CEP deve ter formato válido (00000-000)';
    }
    if (!formData.logradouro.trim()) {
      newErrors.logradouro = 'Logradouro é obrigatório';
    }
    if (!formData.numero.trim()) {
      newErrors.numero = 'Número é obrigatório';
    }
    if (!formData.bairro.trim()) {
      newErrors.bairro = 'Bairro é obrigatório';
    }
    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }
    if (!validateUF(formData.uf)) {
      newErrors.uf = 'UF deve ser válida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive"
      });
      return;
    }
    
    onNext({
      endereco: {
        cep: sanitizeInput(formData.cep),
        logradouro: sanitizeInput(formData.logradouro),
        numero: sanitizeInput(formData.numero),
        complemento: sanitizeInput(formData.complemento),
        bairro: sanitizeInput(formData.bairro),
        cidade: sanitizeInput(formData.cidade),
        uf: sanitizeInput(formData.uf.toUpperCase())
      }
    });
  };

  const handleCepChange = async (cep: string) => {
    const sanitizedCep = sanitizeInput(cep);
    setFormData({ ...formData, cep: sanitizedCep });
    setErrors({ ...errors, cep: '' });
    
    // Remove non-digits and check if CEP is complete
    const cleanCep = sanitizedCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      // Rate limit CEP requests
      if (!checkRateLimit(`cep-${cleanCep}`, 3, 30000)) {
        toast({
          title: "Muitas tentativas",
          description: "Aguarde antes de buscar outro CEP",
          variant: "destructive"
        });
        return;
      }
      
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (!response.ok) {
          throw new Error('Erro na consulta do CEP');
        }
        
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: sanitizeInput(data.logradouro || ''),
            bairro: sanitizeInput(data.bairro || ''),
            cidade: sanitizeInput(data.localidade || ''),
            uf: sanitizeInput(data.uf || '')
          }));
        } else {
          setErrors({ ...errors, cep: 'CEP não encontrado' });
        }
      } catch (error) {
        const errorMessage = createSecureErrorResponse(error);
        setErrors({ ...errors, cep: errorMessage });
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereço</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={formData.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              className={errors.cep ? 'border-red-500' : ''}
              required
            />
            {errors.cep && <p className="text-sm text-red-500 mt-1">{errors.cep}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input
              id="logradouro"
              value={formData.logradouro}
              onChange={(e) => setFormData({ ...formData, logradouro: sanitizeInput(e.target.value) })}
              className={errors.logradouro ? 'border-red-500' : ''}
              required
            />
            {errors.logradouro && <p className="text-sm text-red-500 mt-1">{errors.logradouro}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: sanitizeInput(e.target.value) })}
                className={errors.numero ? 'border-red-500' : ''}
                required
              />
              {errors.numero && <p className="text-sm text-red-500 mt-1">{errors.numero}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: sanitizeInput(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: sanitizeInput(e.target.value) })}
              className={errors.bairro ? 'border-red-500' : ''}
              required
            />
            {errors.bairro && <p className="text-sm text-red-500 mt-1">{errors.bairro}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: sanitizeInput(e.target.value) })}
                className={errors.cidade ? 'border-red-500' : ''}
                required
              />
              {errors.cidade && <p className="text-sm text-red-500 mt-1">{errors.cidade}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                value={formData.uf}
                onChange={(e) => setFormData({ ...formData, uf: sanitizeInput(e.target.value.toUpperCase()) })}
                maxLength={2}
                className={errors.uf ? 'border-red-500' : ''}
                required
              />
              {errors.uf && <p className="text-sm text-red-500 mt-1">{errors.uf}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Próximo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
