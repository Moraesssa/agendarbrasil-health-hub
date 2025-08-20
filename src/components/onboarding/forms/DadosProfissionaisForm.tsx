
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
import { validateCRM, validatePhone, sanitizeInput } from "@/utils/validation";

const dadosProfissionaisSchema = z.object({
  crm: z.string()
    .min(1, "CRM é obrigatório")
    .refine(validateCRM, "CRM deve ter formato válido (ex: 123456/SP)"),
  especialidades: z.array(z.string())
    .min(1, "Pelo menos uma especialidade é obrigatória"),
  telefone: z.string()
    .min(1, "Telefone é obrigatório")
    .refine(validatePhone, "Telefone deve ter formato válido"),
  whatsapp: z.string().optional()
    .refine((val) => !val || validatePhone(val), "WhatsApp deve ter formato válido")
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
      especialidades: Array.isArray(initialData?.especialidades) ? initialData.especialidades : [],
      telefone: initialData?.telefone || '',
      whatsapp: initialData?.whatsapp || ''
    }
  });

  const onSubmit = (data: DadosProfissionaisFormData) => {
    const especialidades = Array.isArray(data.especialidades) ? data.especialidades : [];
    onNext({
      crm: sanitizeInput(data.crm),
      especialidades: especialidades.map(spec => sanitizeInput(spec)),
      telefone: sanitizeInput(data.telefone),
      whatsapp: data.whatsapp ? sanitizeInput(data.whatsapp) : null
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
                      data-testid="crm-input"
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
                <FormItem data-testid="especialidade-select">
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
                      data-testid="telefone-input"
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
                      data-testid="whatsapp-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" data-testid="form-step-1-next">
              Próximo
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
