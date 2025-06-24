
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2 } from "lucide-react";

const dadosProfissionaisSchema = z.object({
  crm: z.string()
    .min(5, "CRM deve ter no mínimo 5 caracteres")
    .nonempty("CRM é obrigatório"),
  especialidades: z.array(
    z.object({
      value: z.string().min(1, "Especialidade não pode estar vazia")
    })
  ).min(1, "Pelo menos uma especialidade é obrigatória"),
  telefone: z.string()
    .min(10, "Telefone deve ter no mínimo 10 caracteres")
    .nonempty("Telefone é obrigatório"),
  whatsapp: z.string().optional()
});

type DadosProfissionaisFormData = z.infer<typeof dadosProfissionaisSchema>;

interface DadosProfissionaisFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

export const DadosProfissionaisForm = ({ onNext, initialData }: DadosProfissionaisFormProps) => {
  const form = useForm<DadosProfissionaisFormData>({
    resolver: zodResolver(dadosProfissionaisSchema),
    defaultValues: {
      crm: initialData?.crm || '',
      especialidades: initialData?.especialidades?.length > 0 
        ? initialData.especialidades.map((esp: string) => ({ value: esp }))
        : [{ value: '' }],
      telefone: initialData?.telefone || '',
      whatsapp: initialData?.whatsapp || ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "especialidades"
  });

  const onSubmit = (data: DadosProfissionaisFormData) => {
    onNext({
      crm: data.crm,
      especialidades: data.especialidades.map(esp => esp.value).filter(e => e.trim()),
      telefone: data.telefone,
      whatsapp: data.whatsapp || null
    });
  };

  const addEspecialidade = () => {
    append({ value: '' });
  };

  const removeEspecialidade = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Profissionais</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="crm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRM</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 123456/SP"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Especialidades</FormLabel>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`especialidades.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Digite uma especialidade"
                            {...field}
                          />
                        </FormControl>
                        {fields.length > 1 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeEspecialidade(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button 
                type="button" 
                variant="outline" 
                onClick={addEspecialidade}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Especialidade
              </Button>
            </div>

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Próximo
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
