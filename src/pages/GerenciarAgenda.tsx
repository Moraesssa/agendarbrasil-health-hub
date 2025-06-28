import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save, Undo2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { logger } from "@/utils/logger";

// --- Tipos e Esquemas ---
const horarioSchema = z.object({
  ativo: z.boolean(),
  inicio: z.string(),
  fim: z.string(),
}).refine(data => !data.ativo || (data.inicio && data.fim && data.inicio < data.fim), {
  message: "Início deve ser antes do fim.",
  path: ["inicio"],
});

const agendaSchema = z.object({
  horarios: z.record(horarioSchema)
});

type AgendaFormData = z.infer<typeof agendaSchema>;
type HorarioConfig = z.infer<typeof horarioSchema>;

const diasDaSemana = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
] as const;

// --- Componente Principal ---
const GerenciarAgenda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      horarios: diasDaSemana.reduce((acc, dia) => {
        acc[dia.key] = { ativo: dia.key !== 'sabado' && dia.key !== 'domingo', inicio: '08:00', fim: '18:00' };
        return acc;
      }, {} as Record<string, HorarioConfig>)
    }
  });

  const { reset, handleSubmit, control, formState: { isDirty, errors } } = form;

  const fetchHorarios = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    logger.info("Buscando horários para o médico...", "GerenciarAgenda", { userId: user.id });
    try {
      const { data, error } = await supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single();
      
      if (error && error.code !== 'PGRST116') throw error;

      const configuracoes = data?.configuracoes as Record<string, any> || {};
      const horarioAtendimento = configuracoes?.horarioAtendimento || {};
      
      const horariosParaForm = diasDaSemana.reduce((acc, dia) => {
        const diaConfig = horarioAtendimento[dia.key] as Record<string, any> || {};
        acc[dia.key] = {
          ativo: diaConfig?.ativo ?? (dia.key !== 'sabado' && dia.key !== 'domingo'),
          inicio: diaConfig?.inicio || '08:00',
          fim: diaConfig?.fim || '18:00',
        };
        return acc;
      }, {} as Record<string, HorarioConfig>);

      reset({ horarios: horariosParaForm });
    } catch (error) {
      logger.error("Erro ao carregar horários", "GerenciarAgenda", error);
      toast({ title: "Erro ao carregar horários", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, reset, toast]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const onSubmit = async (data: AgendaFormData) => {
    if (!user?.id) return toast({ title: "Erro de autenticação", variant: "destructive" });
    
    setIsSubmitting(true);
    logger.info("Salvando horários...", "GerenciarAgenda", { userId: user.id });

    try {
      const { data: medicoData, error: fetchError } = await supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single();
      if (fetchError) throw fetchError;

      const configuracoes = medicoData.configuracoes as Record<string, any> || {};
      const newConfiguracoes = {
        ...configuracoes,
        horarioAtendimento: data.horarios
      };

      const { error: updateError } = await supabase.from('medicos').update({ configuracoes: newConfiguracoes }).eq('user_id', user.id);
      if (updateError) throw updateError;

      toast({ title: "Agenda atualizada com sucesso!" });
      reset(data);
    } catch (error) {
      logger.error("Erro ao salvar agenda", "GerenciarAgenda", error);
      toast({ title: "Erro ao salvar agenda", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader message="Carregando sua agenda..." />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-blue-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-green-600 bg-clip-text text-transparent">Meus Horários</h1>
              <p className="text-sm text-gray-600">
                Defina sua disponibilidade semanal
                {isDirty && <span className="ml-2 text-amber-600 font-medium animate-pulse">• Alterações não salvas</span>}
              </p>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Card className="max-w-4xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Horários de Atendimento
                </CardTitle>
                <CardDescription>
                  Ative os dias que deseja atender e defina os horários de início e fim para cada um.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      {diasDaSemana.map((dia) => (
                        <Card key={dia.key} className="p-4">
                          <Controller
                            name={`horarios.${dia.key}`}
                            control={control}
                            render={({ field }) => (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center w-full sm:w-48">
                                  <Switch
                                    checked={field.value.ativo}
                                    onCheckedChange={(checked) => field.onChange({ ...field.value, ativo: checked })}
                                    id={`switch-${dia.key}`}
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
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          />
                           {errors.horarios?.[dia.key]?.inicio && <FormMessage className="mt-2">{errors.horarios?.[dia.key]?.inicio?.message}</FormMessage>}
                        </Card>
                      ))}
                    </div>
                    <div className="flex justify-end items-center gap-4 pt-4 border-t">
                       {isDirty && (
                        <Button type="button" variant="ghost" onClick={() => fetchHorarios()}>
                          <Undo2 className="w-5 h-5 mr-2" />
                          Desfazer
                        </Button>
                      )}
                      <Button type="submit" className="px-8 py-3 text-base" disabled={isSubmitting || !isDirty}>
                        {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </div>
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
