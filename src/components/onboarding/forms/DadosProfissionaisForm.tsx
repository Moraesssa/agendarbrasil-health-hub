
import { useForm } from "react-hook-form";
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
import { SpecialtyMultiSelect } from "@/components/specialty/SpecialtyMultiSelect";

const dadosProfissionaisSchema = z.object({
  crm: z.string()
    .min(5, "CRM deve ter no mínimo 5 caracteres")
    .nonempty("CRM é obrigatório"),
  especialidades: z.array(z.string())
    .min(1, "Pelo menos uma especialidade é obrigatória"),
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
      especialidades: initialData?.especialidades || [],
      telefone: initialData?.telefone || '',
      whatsapp: initialData?.whatsapp || ''
    }
  });

  const onSubmit = (data: DadosProfissionaisFormData) => {
    onNext({
      crm: data.crm,
      especialidades: data.especialidades,
      telefone: data.telefone,
      whatsapp: data.whatsapp || null
    });
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

            <FormField
              control={form.control}
              name="especialidades"
              render={({ field }) => (
                <FormItem>
                  <SpecialtyMultiSelect
                    initialSpecialties={field.value}
                    onChange={(specialties) => {
                      field.onChange(specialties);
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

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
