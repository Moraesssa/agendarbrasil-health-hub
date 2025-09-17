import { useForm, Controller } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { validateNumericRange, validateTimeFormat, sanitizeNumericInput } from "@/utils/validation";

// --- Zod Schema com a nova estrutura de horários ---
const horarioSchema = z.object({
  ativo: z.boolean(),
  inicio: z.string().refine(validateTimeFormat, "Formato de hora inválido (HH:MM)"),
  fim: z.string().refine(validateTimeFormat, "Formato de hora inválido (HH:MM)"),
}).refine(data => !data.ativo || (data.inicio && data.fim && data.inicio < data.fim), {
  message: "Início deve ser antes do fim.",
  path: ["inicio"],
});

const configuracoesSchema = z.object({
  duracaoConsulta: z.coerce.number()
    .refine(val => validateNumericRange(val, 15, 120), "Duração deve estar entre 15 e 120 minutos"),
  valorConsulta: z.coerce.number()
    .refine(val => validateNumericRange(val, 0.01, 10000), "Valor deve estar entre R$ 0,01 e R$ 10.000"),
  aceitaConvenio: z.boolean().default(false),
  horarios: z.record(horarioSchema)
});

type ConfiguracoesFormData = z.infer<typeof configuracoesSchema>;
type HorarioConfig = z.infer<typeof horarioSchema>;

// --- Component Props ---
interface ConfiguracoesFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

const diasDaSemana = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
] as const;


// --- Componente ---
export const ConfiguracoesForm = ({ onNext, initialData }: ConfiguracoesFormProps) => {
  const form = useForm<ConfiguracoesFormData>({
    resolver: zodResolver(configuracoesSchema),
    defaultValues: {
      duracaoConsulta: initialData?.duracaoConsulta || 30,
      valorConsulta: initialData?.valorConsulta || 150,
      aceitaConvenio: initialData?.aceitaConvenio || false,
      horarios: diasDaSemana.reduce((acc, dia) => {
        acc[dia.key] = {
          ativo: initialData?.horarioAtendimento?.[dia.key]?.ativo ?? (dia.key !== 'sabado' && dia.key !== 'domingo'),
          inicio: initialData?.horarioAtendimento?.[dia.key]?.inicio || '08:00',
          fim: initialData?.horarioAtendimento?.[dia.key]?.fim || '18:00',
        };
        return acc;
      }, {} as Record<string, HorarioConfig>)
    }
  });

  const onSubmit = (data: ConfiguracoesFormData) => {
    onNext({
      configuracoes: {
        duracaoConsulta: data.duracaoConsulta,
        valorConsulta: data.valorConsulta,
        aceitaConvenio: data.aceitaConvenio,
        horarioAtendimento: data.horarios, // O formato já está correto
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
                    <FormControl>
                      <Input 
                        type="number"
                        min="15"
                        max="120"
                        {...field}
                        onChange={(e) => field.onChange(sanitizeNumericInput(e.target.value))}
                        data-testid="duracao-consulta-select"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valorConsulta" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Consulta (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="10000"
                        {...field}
                        onChange={(e) => field.onChange(sanitizeNumericInput(e.target.value))}
                        data-testid="valor-consulta-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="aceitaConvenio" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4" data-testid="aceita-convenio-checkbox">
                   <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                   <div className="space-y-1 leading-none">
                    <FormLabel>Aceita convênios</FormLabel>
                   </div>
                </FormItem>
              )} />
            </div>
            
            <Separator />

            {/* Gerenciador de Horários (Novo Design) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Horários de Atendimento</h3>
              </div>
              <div className="space-y-3">
                {diasDaSemana.map((dia) => (
                  <Card key={dia.key} className="p-4 bg-slate-50" data-testid={`horario-${dia.key}`}>
                    <Controller
                      name={`horarios.${dia.key}`}
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center w-full sm:w-48">
                            <Switch
                              checked={field.value.ativo}
                              onCheckedChange={(checked) => field.onChange({ ...field.value, ativo: checked })}
                              id={`switch-${dia.key}`}
                              data-testid={`switch-${dia.key}`}
                            />
                            <Label htmlFor={`switch-${dia.key}`} className="ml-3 font-semibold text-base">
                              {dia.label}
                            </Label>
                          </div>
                          <div className={`flex-1 w-full grid grid-cols-2 gap-4 transition-opacity ${field.value.ativo ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <div>
                              <Label htmlFor={`inicio-${dia.key}`}>Início</Label>
                              <Input
                                id={`inicio-${dia.key}`}
                                type="time"
                                value={field.value.inicio}
                                onChange={(e) => field.onChange({ ...field.value, inicio: e.target.value })}
                                disabled={!field.value.ativo}
                                data-testid={`inicio-${dia.key}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`fim-${dia.key}`}>Fim</Label>
                              <Input
                                id={`fim-${dia.key}`}
                                type="time"
                                value={field.value.fim}
                                onChange={(e) => field.onChange({ ...field.value, fim: e.target.value })}
                                disabled={!field.value.ativo}
                                data-testid={`fim-${dia.key}`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    />
                     {form.formState.errors.horarios?.[dia.key]?.inicio && <FormMessage className="mt-2">{form.formState.errors.horarios?.[dia.key]?.inicio?.message}</FormMessage>}
                  </Card>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" data-testid="form-step-4-next">Próximo</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};