
import { useState } from "react";
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
import { normalizeCRM, validateCRM, validatePhone, sanitizeInput } from "@/utils/validation";
import { verifyCRMWithExternalService } from "@/services/crmValidationService";

const dadosProfissionaisSchema = z.object({
  crm: z.string()
    .min(1, "CRM é obrigatório")
    .refine(validateCRM, "CRM deve seguir o formato numérico/UF (ex: 12345/SP)"),
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

  const [isVerifyingCRM, setIsVerifyingCRM] = useState(false);

  const onSubmit = async (data: DadosProfissionaisFormData) => {
    const normalizedCRM = normalizeCRM(data.crm);
    const especialidades = Array.isArray(data.especialidades) ? data.especialidades : [];
    form.clearErrors("crm");
    try {
      setIsVerifyingCRM(true);
      const verification = await verifyCRMWithExternalService(normalizedCRM);
      if (verification && verification.status !== "valid") {
        const message = verification.message || (verification.status === "invalid"
          ? "CRM não encontrado na base oficial"
          : "Não foi possível validar o CRM na base oficial");
        form.setError("crm", { type: "manual", message });
        return;
      }
    } finally {
      setIsVerifyingCRM(false);
    }

    onNext({
      crm: normalizedCRM,
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
                      className={form.formState.errors.crm ? "border-destructive" : undefined}
                      data-testid="crm-input"
                      {...field}
                      onChange={(event) => {
                        form.clearErrors("crm");
                        field.onChange(event);
                      }}
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

            <Button
              type="submit"
              className="w-full"
              data-testid="form-step-1-next"
              disabled={isVerifyingCRM}
            >
              {isVerifyingCRM ? "Validando CRM..." : "Próximo"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
