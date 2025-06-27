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
import { Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface HorarioConfig {
  inicio: string;
  fim: string;
  ativo: boolean;
}

interface MedicoConfiguracoes {
  horarioAtendimento?: Record<string, HorarioConfig>;
}

// --- Zod Schema for Validation ---
const horarioSchema = z.object({
  dia: z.string(),
  label: z.string(),
  index: z.number(),
  ativo: z.boolean(),
  inicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  fim: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido")
}).refine(data => {
  if (!data.ativo) return true;
  
  const [inicioHora, inicioMinuto] = data.inicio.split(':').map(Number);
  const [fimHora, fimMinuto] = data.fim.split(':').map(Number);
  
  const inicioTotal = inicioHora * 60 + inicioMinuto;
  const fimTotal = fimHora * 60 + fimMinuto;
  
  return inicioTotal < fimTotal;
}, {
  message: "Horário de início deve ser anterior ao horário de fim",
  path: ["inicio"], 
});

const agendaSchema = z.object({
  horarios: z.array(horarioSchema)
});

type AgendaFormData = z.infer<typeof agendaSchema>;
type HorarioData = z.infer<typeof horarioSchema>;

const diasDaSemana = [
  { key: "domingo", label: "Domingo", index: 0 },
  { key: "segunda", label: "Segunda-feira", index: 1 },
  { key: "terca", label: "Terça-feira", index: 2 },
  { key: "quarta", label: "Quarta-feira", index: 3 },
  { key: "quinta", label: "Quinta-feira", index: 4 },
  { key: "sexta", label: "Sexta-feira", index: 5 },
  { key: "sabado", label: "Sábado", index: 6 },
] as const;

const GerenciarAgenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const form = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      horarios: diasDaSemana.map(dia => ({ 
        dia: dia.key, 
        label: dia.label, 
        index: dia.index,
        ativo: dia.key !== 'sabado' && dia.key !== 'domingo', 
        inicio: '08:00', 
        fim: '18:00' 
      }))
    }
  });

  const { reset, setValue, getValues, watch, formState: { errors, isDirty } } = form;

  const watchedHorarios = watch("horarios");

  // Monitorar mudanças não salvas - usando uma abordagem mais direta
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change' && name) {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const fetchHorarios = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar horários:', error);
        throw error;
      }

      const configuracoes = data?.configuracoes as MedicoConfiguracoes | null;
      const horarioAtendimento = configuracoes?.horarioAtendimento;

      const initialHorarios: HorarioData[] = diasDaSemana.map(dia => ({
        dia: dia.key,
        label: dia.label,
        index: dia.index,
        ativo: horarioAtendimento?.[dia.key]?.ativo ?? (dia.key !== 'sabado' && dia.key !== 'domingo'),
        inicio: horarioAtendimento?.[dia.key]?.inicio || '08:00',
        fim: horarioAtendimento?.[dia.key]?.fim || '18:00',
      }));

      reset({ horarios: initialHorarios });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast({ 
        title: "Erro ao carregar horários", 
        description: "Não foi possível carregar seus horários de atendimento.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, reset, toast]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const onSubmit = async (data: AgendaFormData) => {
    console.log('Form submitted with data:', data); // Debug log
    
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validar horários ativos
      const horariosAtivos = data.horarios.filter(h => h.ativo);
      if (horariosAtivos.length === 0) {
        toast({
          title: "Atenção",
          description: "Você deve ter pelo menos um dia ativo para atendimento.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const horarioAtendimento = data.horarios.reduce((acc, curr) => {
        acc[curr.dia] = { 
          inicio: curr.inicio, 
          fim: curr.fim, 
          ativo: curr.ativo 
        };
        return acc;
      }, {} as Record<string, HorarioConfig>);

      // Buscar configurações atuais
      const { data: medicoData, error: fetchError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar dados do médico:', fetchError);
        throw fetchError;
      }

      const currentConfiguracoes = (medicoData?.configuracoes as MedicoConfiguracoes) || {};
      const newConfiguracoes: MedicoConfiguracoes = { 
        ...currentConfiguracoes, 
        horarioAtendimento 
      };
      
      const { error: updateError } = await supabase
        .from('medicos')
        .update({ configuracoes: newConfiguracoes })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar configurações:', updateError);
        throw updateError;
      }

      toast({ 
        title: "Agenda atualizada!", 
        description: "Seus horários de atendimento foram salvos com sucesso.",
        duration: 5000
      });

      setHasUnsavedChanges(false);
      // Resetar o form com os novos dados para limpar o estado dirty
      reset(data, { keepValues: true });

    } catch (error) {
      console.error('Erro ao salvar agenda:', error);
      toast({ 
        title: "Erro ao salvar", 
        description: "Não foi possível atualizar sua agenda. Tente novamente.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchChange = (dayIndex: number, checked: boolean) => {
    setValue(`horarios.${dayIndex}.ativo`, checked, { 
      shouldValidate: true, 
      shouldDirty: true,
      shouldTouch: true
    });
    // Força a atualização do estado de mudanças
    setHasUnsavedChanges(true);
  };

  const handleTimeChange = (dayIndex: number, field: 'inicio' | 'fim', value: string) => {
    setValue(`horarios.${dayIndex}.${field}`, value, { 
      shouldValidate: true, 
      shouldDirty: true,
      shouldTouch: true
    });
    // Força a atualização do estado de mudanças
    setHasUnsavedChanges(true);
  };

  // Função para obter o dia selecionado de forma segura
  const getSelectedDayInfo = () => {
    const dayIndex = selectedDate ? selectedDate.getDay() : new Date().getDay();
    const horario = getValues(`horarios.${dayIndex}`);
    const diaInfo = diasDaSemana.find(d => d.index === dayIndex);
    return { dayIndex, horario, diaInfo };
  };

  if (loading) {
    return <PageLoader message="Carregando sua agenda..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { dayIndex, horario, diaInfo } = getSelectedDayInfo();

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
                Selecione um dia da semana para editar seus horários
                {hasUnsavedChanges && (
                  <span className="ml-2 text-amber-600 font-medium">• Alterações não salvas</span>
                )}
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Calendário */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          Calendário
                          <span className="text-sm font-normal text-gray-500">
                            (Dias em verde = ativos para atendimento)
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 flex justify-center">
                        <DayPickerCalendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          locale={ptBR}
                          modifiers={{ 
                            active: (date) => watchedHorarios?.[date.getDay()]?.ativo 
                          }}
                          modifiersClassNames={{
                            active: 'bg-green-100/70 text-green-800',
                            selected: 'bg-blue-600 text-white focus:bg-blue-600 focus:text-white rounded-md',
                          }}
                          className="rounded-md border"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Edição de Horário */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          Editar Horário
                          {horario?.ativo && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </CardTitle>
                        <CardDescription>
                          Ajustes para: <span className="font-semibold text-blue-600">{diaInfo?.label}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {horario && diaInfo && (
                          <FormField
                            control={form.control}
                            name={`horarios.${dayIndex}`}
                            render={({ field }) => (
                              <FormItem className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50/50">
                                  <div>
                                    <Label className="text-base font-semibold">Atender neste dia?</Label>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {field.value.ativo ? 'Ativo para atendimento' : 'Inativo'}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={field.value.ativo}
                                    onCheckedChange={(checked) => handleSwitchChange(dayIndex, checked)}
                                  />
                                </div>

                                {field.value.ativo && (
                                  <div className="space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`inicio-${dayIndex}`}>Horário de Início</Label>
                                        <Input 
                                          id={`inicio-${dayIndex}`}
                                          type="time" 
                                          value={field.value.inicio}
                                          onChange={(e) => handleTimeChange(dayIndex, 'inicio', e.target.value)}
                                          className="font-mono"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`fim-${dayIndex}`}>Horário de Fim</Label>
                                        <Input 
                                          id={`fim-${dayIndex}`}
                                          type="time" 
                                          value={field.value.fim}
                                          onChange={(e) => handleTimeChange(dayIndex, 'fim', e.target.value)}
                                          className="font-mono"
                                        />
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                                      <strong>Duração do atendimento:</strong>{' '}
                                      {(() => {
                                        const [inicioH, inicioM] = field.value.inicio.split(':').map(Number);
                                        const [fimH, fimM] = field.value.fim.split(':').map(Number);
                                        const inicioMinutos = inicioH * 60 + inicioM;
                                        const fimMinutos = fimH * 60 + fimM;
                                        const duracao = fimMinutos - inicioMinutos;
                                        const horas = Math.floor(duracao / 60);
                                        const minutos = duracao % 60;
                                        return `${horas}h${minutos > 0 ? ` ${minutos}min` : ''}`;
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {errors.horarios?.[dayIndex] && (
                                  <div className="space-y-1">
                                    {errors.horarios[dayIndex]?.inicio?.message && (
                                      <FormMessage className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.horarios[dayIndex]?.inicio?.message}
                                      </FormMessage>
                                    )}
                                    {errors.horarios[dayIndex]?.fim?.message && (
                                      <FormMessage className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.horarios[dayIndex]?.fim?.message}
                                      </FormMessage>
                                    )}
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
                
                {/* Resumo dos horários */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo da Agenda</CardTitle>
                    <CardDescription>Visão geral dos seus horários de atendimento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {watchedHorarios.map((horario, index) => (
                        <div 
                          key={horario.dia} 
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md",
                            horario.ativo 
                              ? "border-green-200 bg-green-50 hover:border-green-300" 
                              : "border-gray-200 bg-gray-50 hover:border-gray-300",
                            dayIndex === index && "ring-2 ring-blue-500 ring-offset-2"
                          )}
                          onClick={() => setSelectedDate(new Date(2024, 0, index))} // Hack para selecionar o dia
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{horario.label}</span>
                            {horario.ativo ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                          {horario.ativo && (
                            <div className="text-xs text-gray-600 font-mono">
                              {horario.inicio} - {horario.fim}
                            </div>
                          )}
                          {!horario.ativo && (
                            <div className="text-xs text-gray-400">Inativo</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    className={cn(
                      "px-8 py-2 transition-all",
                      hasUnsavedChanges && "animate-pulse"
                    )}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    {isSubmitting ? 'Salvando...' : hasUnsavedChanges ? 'Salvar Alterações' : 'Alterações Salvas'}
                  </Button>
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