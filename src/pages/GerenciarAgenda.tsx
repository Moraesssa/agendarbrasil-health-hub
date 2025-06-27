import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Save, Undo2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- Interfaces e Tipos ---
interface HorarioConfig {
  inicio: string;
  fim: string;
  ativo: boolean;
}

interface MedicoConfiguracoes {
  horarioAtendimento?: Record<string, HorarioConfig>;
  [key: string]: any;
}

// --- Zod Schema for Validation ---
const horarioSchema = z.object({
  dia: z.string(),
  label: z.string(),
  index: z.number(),
  ativo: z.boolean(),
  inicio: z.string(),
  fim: z.string(),
}).refine(data => !data.ativo || data.inicio < data.fim, {
  message: "Início deve ser antes do fim.",
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
] as const;

// --- Componente Principal ---
const GerenciarAgenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const form = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      horarios: diasDaSemana.map(dia => ({ ...dia, ativo: false, inicio: '08:00', fim: '18:00' }))
    }
  });

  const { reset, setValue, getValues, watch, formState: { errors, isDirty } } = form;
  const watchedHorarios = watch("horarios");

  const fetchHorarios = useCallback(async (showToast = false) => {
    if (!user?.id) { setLoading(false); return; }
    if (!loading) setLoading(true); // Só mostra o loader se não estiver carregando
    
    try {
      const { data, error } = await supabase.from('medicos').select('configuracoes').eq('user_id', user.id).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;

      const configuracoes = data?.configuracoes as MedicoConfiguracoes | null;
      const horarioAtendimento = configuracoes?.horarioAtendimento;

      const initialHorarios = diasDaSemana.map(dia => ({
        ...dia,
        ativo: horarioAtendimento?.[dia.key]?.ativo ?? (dia.key !== 'sabado' && dia.key !== 'domingo'),
        inicio: horarioAtendimento?.[dia.key]?.inicio || '08:00',
        fim: horarioAtendimento?.[dia.key]?.fim || '18:00',
      }));
      reset({ horarios: initialHorarios });
      if (showToast) toast({ title: "Alterações descartadas", description: "Seus horários foram revertidos para a última versão salva." });
    } catch (error) {
      toast({ title: "Erro ao carregar horários", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, reset, toast, loading]);

  useEffect(() => {
    fetchHorarios();
  }, [user?.id]); // Apenas na montagem inicial

  const onSubmit = async (data: AgendaFormData) => {
    if (!user?.id) return toast({ title: "Erro de autenticação", variant: "destructive" });
    setIsSubmitting(true);
    
    try {
      const { data: medicoData, error: fetchError } = await supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single();
      if (fetchError) throw fetchError;

      const currentConfiguracoes = medicoData.configuracoes || {};
      const newHorarioAtendimento = data.horarios.reduce((acc, curr) => {
        acc[curr.dia] = { inicio: curr.inicio, fim: curr.fim, ativo: curr.ativo };
        return acc;
      }, {} as Record<string, HorarioConfig>);
      
      const newConfiguracoes = { ...currentConfiguracoes, horarioAtendimento: newHorarioAtendimento };

      const { error: updateError } = await supabase.from('medicos').update({ configuracoes: newConfiguracoes }).eq('user_id', user.id);
      if (updateError) throw updateError;

      toast({ title: "Agenda atualizada com sucesso!" });
      reset(data); // Atualiza o estado "limpo" do formulário para o novo estado salvo
    } catch (error) {
      toast({ title: "Erro ao salvar agenda", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedDayIndex = selectedDate ? selectedDate.getDay() : 0;
  const selectedHorario = watchedHorarios?.[selectedDayIndex];

  if (loading) return <PageLoader message="Carregando sua agenda..." />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-blue-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50" />
            <div className="flex-1"><h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-green-600 bg-clip-text text-transparent">Gerenciar Agenda</h1>
              <p className="text-sm text-gray-600">
                Selecione um dia e ajuste seus horários
                {isDirty && <span className="ml-2 text-amber-600 font-medium animate-pulse">• Alterações não salvas</span>}
              </p>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="p-2 flex justify-center">
                        <DayPickerCalendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
                          modifiers={{ active: (date) => watchedHorarios?.[date.getDay()]?.ativo }}
                          modifiersClassNames={{ active: 'bg-green-100/70', selected: 'bg-blue-600 text-white focus:bg-blue-600 focus:text-white rounded-md' }}/>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader><CardTitle>Editar Horário</CardTitle><CardDescription>Ajustes para: <span className="font-semibold text-blue-600">{diasDaSemana.find(d => d.index === selectedDayIndex)?.label}</span></CardDescription></CardHeader>
                      <CardContent>
                        {selectedHorario && (
                          <FormField control={form.control} name={`horarios.${selectedDayIndex}`} render={({ field }) => (
                              <FormItem className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                  <Label className="text-base font-semibold">Atender neste dia?</Label>
                                  <Switch checked={field.value.ativo} onCheckedChange={(checked) => setValue(`horarios.${selectedDayIndex}.ativo`, checked, { shouldDirty: true, shouldValidate: true })} />
                                </div>
                                {field.value.ativo && (
                                  <div className="space-y-4 animate-in fade-in-0">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div><Label>Início</Label><Input type="time" {...form.register(`horarios.${selectedDayIndex}.inicio`)} /></div>
                                      <div><Label>Fim</Label><Input type="time" {...form.register(`horarios.${selectedDayIndex}.fim`)} /></div>
                                    </div>
                                    {errors.horarios?.[selectedDayIndex]?.inicio && <FormMessage>{errors.horarios[selectedDayIndex]?.inicio?.message}</FormMessage>}
                                  </div>
                                )}
                              </FormItem>
                            )}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div className="flex justify-center items-center gap-4 pt-4">
                  <Button type="submit" className="px-8 py-3 text-base" disabled={isSubmitting || !isDirty}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  {isDirty && (
                    <Button type="button" variant="ghost" onClick={() => fetchHorarios(true)}>
                      <Undo2 className="w-5 h-5 mr-2" />
                      Desfazer
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default GerenciarAgenda;