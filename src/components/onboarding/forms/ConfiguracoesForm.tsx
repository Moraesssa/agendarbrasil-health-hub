import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Clock } from "lucide-react";

// --- Zod Schema for Validation ---
const configuracoesSchema = z.object({
  duracaoConsulta: z.coerce.number().min(15, "Mínimo 15 min").max(120, "Máximo 120 min"),
  valorConsulta: z.coerce.number().positive("O valor deve ser positivo"),
  aceitaConvenio: z.boolean().default(false),
  horarios: z.array(z.object({
    dia: z.string(),
    label: z.string(),
    ativo: z.boolean(),
    inicio: z.string(),
    fim: z.string()
  })).superRefine((horarios, ctx) => {
    horarios.forEach((horario, index) => {
      if (horario.ativo && horario.inicio >= horario.fim) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O horário de início deve ser anterior ao de fim.",
          path: [index, 'inicio'],
        });
      }
    });
  })
});

type ConfiguracoesFormData = z.infer<typeof configuracoesSchema>;

// --- Component Props ---
interface ConfiguracoesFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

// --- Component ---
export const ConfiguracoesForm = ({ onNext, initialData }: ConfiguracoesFormProps) => {

  const diasDaSemana = [
    { key: "segunda", label: "Segunda-feira" },
    { key: "terca", label: "Terça-feira" },
    { key: "quarta", label: "Quarta-feira" },
    { key: "quinta", label: "Quinta-feira" },
    { key: "sexta", label: "Sexta-feira" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];
  
  const form = useForm<ConfiguracoesFormData>({
    resolver: zodResolver(configuracoesSchema),
    defaultValues: {
      duracaoConsulta: initialData?.duracaoConsulta || 30,
      valorConsulta: initialData?.valorConsulta || 150,
      aceitaConvenio: initialData?.aceitaConvenio || false,
      horarios: diasDaSemana.map(dia => ({
        dia: dia.key,
        label: dia.label,
        ativo: initialData?.horarioAtendimento?.[dia.key]?.ativo ?? (dia.key !== 'sabado' && dia.key !== 'domingo'),
        inicio: initialData?.horarioAtendimento?.[dia.key]?.inicio || '08:00',
        fim: initialData?.horarioAtendimento?.[dia.key]?.fim || '18:00'
      }))
    }
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "horarios"
  });

  const onSubmit = (data: ConfiguracoesFormData) => {
    // Formata os horários para o formato esperado pelo Supabase
    const horarioAtendimento = data.horarios.reduce((acc, curr) => {
      acc[curr.dia] = {
        inicio: curr.inicio,
        fim: curr.fim,
        ativo: curr.ativo
      };
      return acc;
    }, {} as { [key: string]: { inicio: string; fim: string; ativo: boolean } });

    onNext({
      configuracoes: {
        duracaoConsulta: data.duracaoConsulta,
        valorConsulta: data.valorConsulta,
        aceitaConvenio: data.aceitaConvenio,
        horarioAtendimento: horarioAtendimento,
        // Mantém campos que podem existir mas não são editados aqui
        conveniosAceitos: initialData?.conveniosAceitos || [],
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Agenda</CardTitle>
        <CardDescription>Defina os detalhes e os horários dos seus atendimentos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Configurações Gerais */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="duracaoConsulta" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração da Consulta (minutos)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valorConsulta" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Consulta (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="aceitaConvenio" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                   <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                   <div className="space-y-1 leading-none">
                    <FormLabel>Aceita convênios</FormLabel>
                   </div>
                </FormItem>
              )} />
            </div>
            
            <Separator />

            {/* Gerenciador de Horários */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Horários de Atendimento</h3>
              </div>
              <div className="space-y-3">
                {fields.map((item, index) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`horarios.${index}`}
                    render={({ field }) => (
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center w-full sm:w-40">
                          <Checkbox checked={field.value.ativo} onCheckedChange={(checked) => form.setValue(`horarios.${index}.ativo`, !!checked)} />
                          <Label className="ml-3 font-medium">{item.label}</Label>
                        </div>
                        <div className="flex-1 w-full grid grid-cols-2 gap-3">
                          <Input type="time" disabled={!field.value.ativo} {...form.register(`horarios.${index}.inicio`)} />
                          <Input type="time" disabled={!field.value.ativo} {...form.register(`horarios.${index}.fim`)} />
                        </div>
                        <FormMessage>{form.formState.errors.horarios?.[index]?.inicio?.message}</FormMessage>
                      </div>
                    )}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full">Próximo</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};