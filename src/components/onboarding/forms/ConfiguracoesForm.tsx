import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Checkbox } from "@/components/ui/checkbox";



interface ConfiguracoesFormProps {

  onNext: (data: any) => void;

  initialData?: any;

}



export const ConfiguracoesForm = ({ onNext, initialData }: ConfiguracoesFormProps) => {

  const [formData, setFormData] = useState({

    duracaoConsulta: initialData?.duracaoConsulta || 30,

    valorConsulta: initialData?.valorConsulta || '',

    aceitaConvenio: initialData?.aceitaConvenio || false,

    conveniosAceitos: initialData?.conveniosAceitos || []

  });



  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    onNext({

      configuracoes: {

        duracaoConsulta: Number(formData.duracaoConsulta),

        valorConsulta: Number(formData.valorConsulta),

        aceitaConvenio: formData.aceitaConvenio,

        conveniosAceitos: formData.conveniosAceitos,

        horarioAtendimento: {

          segunda: { inicio: '08:00', fim: '18:00', ativo: true },

          terca: { inicio: '08:00', fim: '18:00', ativo: true },

          quarta: { inicio: '08:00', fim: '18:00', ativo: true },

          quinta: { inicio: '08:00', fim: '18:00', ativo: true },

          sexta: { inicio: '08:00', fim: '18:00', ativo: true },

          sabado: { inicio: '08:00', fim: '12:00', ativo: false },

          domingo: { inicio: '08:00', fim: '12:00', ativo: false }

        }

      }

    });

  };



  return (

    <Card>

      <CardHeader>

        <CardTitle>Configurações</CardTitle>

      </CardHeader>

      <CardContent>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">

            <Label htmlFor="duracaoConsulta">Duração da Consulta (minutos)</Label>

            <Input

              id="duracaoConsulta"

              type="number"

              value={formData.duracaoConsulta}

              onChange={(e) => setFormData({ ...formData, duracaoConsulta: Number(e.target.value) })}

              min="15"

              max="120"

              required

            />

          </div>



          <div className="space-y-2">

            <Label htmlFor="valorConsulta">Valor da Consulta (R$)</Label>

            <Input

              id="valorConsulta"

              type="number"

              step="0.01"

              value={formData.valorConsulta}

              onChange={(e) => setFormData({ ...formData, valorConsulta: e.target.value })}

              required

            />

          </div>



          <div className="flex items-center space-x-2">

            <Checkbox

              id="aceitaConvenio"

              checked={formData.aceitaConvenio}

              onCheckedChange={(checked) => 

                setFormData({ ...formData, aceitaConvenio: !!checked })

              }

            />

            <Label htmlFor="aceitaConvenio">Aceita convênios</Label>

          </div>



          <Button type="submit" className="w-full">

            Próximo

          </Button>

        </form>

      </CardContent>

    </Card>

  );

};

