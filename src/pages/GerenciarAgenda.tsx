import { useState, useEffect, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Clock, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";

// --- Constantes ---
const diasDaSemana = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

// --- Schemas ---
const horarioSchema = z.object({
  dia: z.string(),
  label: z.string(),
  ativo: z.boolean(),
  inicio: z.string()
    .refine(time => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
      message: "Formato de hora inválido"
    }),
  fim: z.string()
    .refine(time => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
      message: "Formato de hora inválido"
    })
}).refine(data => !data.ativo || data.inicio < data.fim, {
  message: "Horário de início deve ser anterior ao fim",
  path: ["inicio"]
});

const agendaSchema = z.object({
  horarios: z.array(horarioSchema)
});

type AgendaFormData = z.infer<typeof agendaSchema>;

// --- Custom Hooks ---
const useAgendaManager = (user: any) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const fetchHorarios = useCallback(async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return data?.configuracoes?.horarioAtendimento;
    } catch (error) {
      toast({
        title: "Erro ao carregar horários",
        description: "Não foi possível buscar sua agenda atual.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  return { loading, setLoading, fetchHorarios };
};

// --- Componentes Memoizados ---
const HorarioItem = memo(({ 
  horario, 
  index, 
  form, 
  onToggle 
}: { 
  horario: any; 
  index: number; 
  form: any; 
  onToggle: (index: number) => void;
}) => {
  return (
    <FormField
      control={form.control}
      name={`horarios.${index}`}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg transition-all cursor-pointer",
            field.value.ativo ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
          )}
          onClick={() => onToggle(index)}
        >
          <div className="flex items-center w-full sm:w-48">
            <FormControl>
              <Switch
                checked={field.value.ativo}
                aria-label={`Ativar ${horario.label}`}
                className="pointer-events-none"
              />
            </FormControl>
            <Label className={cn(
              "ml-4 font-medium text-base",
              field.value.ativo ? "text-gray-800" : "text-gray-500"
            )}>
              {horario.label}
            </Label>
          </div>
          
          {field.value.ativo ? (
            <div 
              className="flex-1 w-full grid grid-cols-2 gap-4" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                <Label htmlFor={`inicio-${horario.dia}`} className="text-xs text-gray-600">
                  Início
                </Label>
                <Input
                  id={`inicio-${horario.dia}`}
                  type="time"
                  {...form.register(`horarios.${index}.inicio`)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`fim-${horario.dia}`} className="text-xs text-gray-600">
                  Fim
                </Label>
                <Input
                  id={`fim-${horario.dia}`}
                  type="time"
                  {...form.register(`horarios.${index}.fim`)}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-gray-500 font-medium text-sm">Fechado</p>
            </div>
          )}
          <FormMessage className="sm:ml-4 text-red-600 text-xs">
            {form.formState.errors.horarios?.[index]?.inicio?.message}
          </FormMessage>
        </FormItem>
      )}
    />
  );
});

HorarioItem.displayName = 'HorarioItem';

// --- Componente Principal ---
const GerenciarAgenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading, setLoading, fetchHorarios } = useAgendaManager(user);

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
    const initializeHorarios = async () => {
      if (!user) return;
      
      const horarioAtendimento = await fetchHorarios();
      if (horarioAtendimento) {
        const initialHorarios = diasDaSemana.map(dia => ({
          ...dia,
          ativo: horarioAtendimento[dia.key]?.ativo ?? false,
          inicio: horarioAtendimento[dia.key]?.inicio || '08:00',
          fim: horarioAtendimento[dia.key]?.fim || '18:00',
        }));
        form.reset({ horarios: initialHorarios });
      }
      setLoading(false);
    };

    initializeHorarios();
  }, [user, form, fetchHorarios, setLoading]);

  const onToggle = useCallback((index: number) => {
    const currentValue = form.getValues(`horarios.${index}.ativo`);
    form.setValue(`horarios.${index}.ativo`, !currentValue, { shouldValidate: true });
  }, [form]);

  const onSubmit = async (data: AgendaFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const horarioAtendimento = data.horarios.reduce((acc, curr) => {
        acc[curr.dia] = {
          inicio: curr.inicio,
          fim: curr.fim,
          ativo: curr.ativo
        };
        return acc;
      }, {} as Record<string, { inicio: string; fim: string; ativo: boolean }>);

      const { data: medicoData, error: fetchError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('medicos')
        .update({
          configuracoes: {
            ...medicoData.configuracoes,
            horarioAtendimento,
          }
        })
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
              <p className="text-sm text-gray-600">
                Atualize seus dias e horários de atendimento
              </p>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Meus Horários</CardTitle>
                <CardDescription>
                  Ative os dias que você atende e defina os horários de início e fim do seu expediente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {form.getValues('horarios').map((horario, index) => (
                      <HorarioItem
                        key={horario.dia}
                        horario={horario}
                        index={index}
                        form={form}
                        onToggle={onToggle}
                      />
                    ))}
                    <Button 
                      type="submit" 
                      className="w-full mt-8 py-3 text-base" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5 mr-2" />
                      )}
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