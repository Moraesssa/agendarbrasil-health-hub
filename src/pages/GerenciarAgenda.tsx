import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Clock, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";

// --- Zod Schema for Validation ---
const horarioSchema = z.object({
  dia: z.string(),
  label: z.string(),
  ativo: z.boolean(),
  inicio: z.string(),
  fim: z.string()
});

const agendaSchema = z.object({
  horarios: z.array(horarioSchema).superRefine((horarios, ctx) => {
    horarios.forEach((horario, index) => {
      if (horario.ativo && horario.inicio >= horario.fim) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Início deve ser antes do fim.",
          path: [index, 'inicio'],
        });
      }
    });
  })
});

type AgendaFormData = z.infer<typeof agendaSchema>;

const diasDaSemana = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const GerenciarAgenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      horarios: diasDaSemana.map(dia => ({
        ...dia,
        ativo: false,
        inicio: '08:00',
        fim: '18:00'
      }))
    }
  });

  useEffect(() => {
    const fetchHorarios = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('medicos')
          .select('configuracoes')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const horarioAtendimento = data?.configuracoes?.horarioAtendimento;
        if (horarioAtendimento) {
          const initialHorarios = diasDaSemana.map(dia => ({
            ...dia,
            ativo: horarioAtendimento[dia.key]?.ativo ?? false,
            inicio: horarioAtendimento[dia.key]?.inicio || '08:00',
            fim: horarioAtendimento[dia.key]?.fim || '18:00',
          }));
          form.reset({ horarios: initialHorarios });
        }
      } catch (error) {
        toast({
          title: "Erro ao carregar horários",
          description: "Não foi possível buscar sua agenda atual.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [user, form, toast]);

  const onSubmit = async (data: AgendaFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const horarioAtendimento = data.horarios.reduce((acc, curr) => {
        acc[curr.dia] = {
          inicio: curr.inicio,
          fim: curr.fim,
          ativo: curr.ativo
        };
        return acc;
      }, {} as { [key: string]: { inicio: string; fim: string; ativo: boolean } });

    try {
        const { data: medicoData, error: fetchError } = await supabase
            .from('medicos')
            .select('configuracoes')
            .eq('user_id', user.id)
            .single();

        if (fetchError) throw fetchError;

        const newConfiguracoes = {
            ...medicoData.configuracoes,
            horarioAtendimento,
        };
      
        const { error: updateError } = await supabase
            .from('medicos')
            .update({ configuracoes: newConfiguracoes })
            .eq('user_id', user.id);

        if (updateError) throw updateError;

        toast({
            title: "Agenda atualizada!",
            description: "Seus horários de atendimento foram salvos com sucesso.",
        });
    } catch (error) {
        toast({
            title: "Erro ao salvar",
            description: "Não foi possível atualizar sua agenda. Tente novamente.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <PageLoader message="Carregando sua agenda..." />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-blue-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50 transition-colors" />
            <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent">
                    Gerenciar Agenda
                </h1>
                <p className="text-sm text-gray-600">Atualize seus dias e horários de atendimento</p>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Meus Horários</CardTitle>
                <CardDescription>
                  Marque os dias que você atende e defina os horários de início e fim do seu expediente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {form.getValues('horarios').map((item, index) => (
                      <FormField
                        key={item.dia}
                        control={form.control}
                        name={`horarios.${index}`}
                        render={({ field }) => (
                            <FormItem className="flex flex-col sm:flex-row items-center gap-3 p-3 border rounded-lg hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center w-full sm:w-40">
                                    <FormControl>
                                        <Checkbox checked={field.value.ativo} onCheckedChange={(checked) => form.setValue(`horarios.${index}.ativo`, !!checked)} />
                                    </FormControl>
                                    <Label className="ml-3 font-medium">{item.label}</Label>
                                </div>
                                <div className="flex-1 w-full grid grid-cols-2 gap-3">
                                    <FormControl>
                                      <Input type="time" disabled={!field.value.ativo} {...form.register(`horarios.${index}.inicio`)} />
                                    </FormControl>
                                    <FormControl>
                                      <Input type="time" disabled={!field.value.ativo} {...form.register(`horarios.${index}.fim`)} />
                                    </FormControl>
                                </div>
                                <FormMessage>{form.formState.errors.horarios?.[index]?.inicio?.message}</FormMessage>
                            </FormItem>
                        )}
                      />
                    ))}
                    <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Salvar Alterações
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default GerenciarAgenda;