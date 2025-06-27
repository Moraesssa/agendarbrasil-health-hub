import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- Zod Schema for Validation ---
const horarioSchema = z.object({
  dia: z.string(),
  label: z.string(),
  ativo: z.boolean(),
  inicio: z.string(),
  fim: z.string()
}).refine(data => !data.ativo || data.inicio < data.fim, {
  message: "O horário de início deve ser anterior ao de fim.",
  path: ["inicio"], 
});

const agendaSchema = z.object({
  horarios: z.array(horarioSchema)
});

type AgendaFormData = z.infer<typeof agendaSchema>;

const diasDaSemana = [
  { key: "domingo", label: "Domingo", index: 0 },
  { key: "segunda", label: "Segunda-feira", index: 1 },
  { key: "terca", label: "Terça-feira", index: 2 },
  { key: "quarta", label: "Quarta-feira", index: 3 },
  { key: "quinta", label: "Quinta-feira", index: 4 },
  { key: "sexta", label: "Sexta-feira", index: 5 },
  { key: "sabado", label: "Sábado", index: 6 },
];

const GerenciarAgenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());

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
  
  const watchedHorarios = useWatch({ control: form.control, name: "horarios" });

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
            ativo: horarioAtendimento?.[dia.key]?.ativo ?? false,
            inicio: horarioAtendimento?.[dia.key]?.inicio || '08:00',
            fim: horarioAtendimento?.[dia.key]?.fim || '18:00',
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

        const newConfiguracoes = { ...medicoData.configuracoes, horarioAtendimento };
      
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

  const dayPickerModifiers = {
    active: (date: Date) => watchedHorarios?.[date.getDay()]?.ativo,
  };

  const dayPickerModifiersClassNames = {
    active: 'bg-green-100 text-green-800 border-green-200 rounded-md',
  };
  
  const handleDayClick = (day: Date | undefined) => {
      if (!day) return;
      setSelectedDate(day);
      setSelectedDayIndex(day.getDay());
  }

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
                <p className="text-sm text-gray-600">Selecione um dia da semana para editar seus horários</p>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="p-2 flex justify-center">
                        <DayPickerCalendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDayClick}
                            locale={ptBR}
                            modifiers={dayPickerModifiers}
                            modifiersClassNames={dayPickerModifiersClassNames}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Editar Horário</CardTitle>
                        <CardDescription>Ajustes para: <span className="font-semibold text-blue-600">{diasDaSemana.find(d => d.index === selectedDayIndex)?.label}</span></CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                            control={form.control}
                            name={`horarios.${selectedDayIndex}`}
                            render={({ field }) => (
                                <FormItem className="space-y-6">
                                    <div className="flex items-center justify-between rounded-lg border p-4 cursor-pointer" onClick={() => form.setValue(`horarios.${selectedDayIndex}.ativo`, !field.value.ativo, { shouldValidate: true })}>
                                        <Label htmlFor={`switch-${field.value.dia}`} className="text-base font-semibold">Atender neste dia?</Label>
                                        <FormControl>
                                            <Switch
                                                id={`switch-${field.value.dia}`}
                                                checked={field.value.ativo}
                                                className="pointer-events-none"
                                            />
                                        </FormControl>
                                    </div>

                                    {field.value.ativo && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in-0 zoom-in-95" onClick={(e) => e.stopPropagation()}>
                                            <div className="space-y-2">
                                                <Label htmlFor={`inicio-${field.value.dia}`}>Início</Label>
                                                <Input id={`inicio-${field.value.dia}`} type="time" {...form.register(`horarios.${selectedDayIndex}.inicio`)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`fim-${field.value.dia}`}>Fim</Label>
                                                <Input id={`fim-${field.value.dia}`} type="time" {...form.register(`horarios.${selectedDayIndex}.fim`)} />
                                            </div>
                                        </div>
                                    )}
                                    {form.formState.errors.horarios?.[selectedDayIndex] && <FormMessage>{form.formState.errors.horarios[selectedDayIndex]?.inicio?.message}</FormMessage>}
                                </FormItem>
                            )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Button type="submit" className="w-full max-w-xs mx-auto flex" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Salvar Alterações na Agenda
                </Button>
              </form>
            </Form>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default GerenciarAgenda;