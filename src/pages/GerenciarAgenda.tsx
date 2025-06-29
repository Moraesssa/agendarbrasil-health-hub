import { useState, useEffect, useCallback } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormMessage } from "@/components/ui/form";
import { Loader2, Save, Undo2, Clock, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { logger } from "@/utils/logger";
import locationService, { LocalAtendimento } from "@/services/locationService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Tipos e Esquemas Atualizados ---
const horarioSchema = z.object({
  ativo: z.boolean(),
  inicio: z.string(),
  fim: z.string(),
  local_id: z.string().uuid({ message: "Selecione um local válido." }).nullable(),
}).refine(data => {
    if (!data.ativo) return true;
    return !!data.local_id && !!data.inicio && !!data.fim && data.inicio < data.fim;
}, {
  message: "Início deve ser antes do fim e um local deve ser selecionado.",
  path: ["local_id"],
});

const agendaSchema = z.object({
  horarios: z.object(
    diasDaSemana.reduce((acc, dia) => {
      acc[dia.key] = z.array(horarioSchema);
      return acc;
    }, {} as Record<string, z.ZodTypeAny>)
  )
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

const GerenciarAgenda = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locais, setLocais] = useState<LocalAtendimento[]>([]);

    const form = useForm<AgendaFormData>({
        resolver: zodResolver(agendaSchema),
        defaultValues: {
            horarios: diasDaSemana.reduce((acc, dia) => {
                acc[dia.key] = [];
                return acc;
            }, {} as Record<string, HorarioConfig[]>)
        }
    });

    const { reset, handleSubmit, control, formState: { isDirty, errors } } = form;

    const fetchInitialData = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [locaisData, medicoData] = await Promise.all([
                locationService.getLocations(),
                supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single()
            ]);
            
            setLocais(locaisData);

            if (medicoData.error && medicoData.error.code !== 'PGRST116') throw medicoData.error;

            const horarioAtendimento = medicoData.data?.configuracoes?.horarioAtendimento || {};
            
            const horariosParaForm = diasDaSemana.reduce((acc, dia) => {
                acc[dia.key] = horarioAtendimento[dia.key] || [];
                return acc;
            }, {} as Record<string, HorarioConfig[]>);

            reset({ horarios: horariosParaForm });

        } catch (error) {
            logger.error("Erro ao carregar dados da agenda", "GerenciarAgenda", error);
            toast({ title: "Erro ao carregar dados", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user?.id, reset, toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const onSubmit = async (data: AgendaFormData) => {
        if (!user?.id) return toast({ title: "Erro de autenticação", variant: "destructive" });
        setIsSubmitting(true);
        try {
            const { data: medicoData, error: fetchError } = await supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single();
            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            const newConfiguracoes = { ...(medicoData.configuracoes || {}), horarioAtendimento: data.horarios };
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
                                Defina sua disponibilidade e locais para cada dia da semana.
                                {isDirty && <span className="ml-2 text-amber-600 font-medium animate-pulse">• Alterações não salvas</span>}
                            </p>
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto p-6">
                        <Form {...form}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
                                {diasDaSemana.map((dia) => (
                                    <DayScheduleControl key={dia.key} dia={dia} control={control} locais={locais} errors={errors} />
                                ))}
                                <div className="flex justify-end items-center gap-4 pt-4 mt-6 border-t">
                                   {isDirty && (
                                    <Button type="button" variant="ghost" onClick={() => fetchInitialData()}>
                                      <Undo2 className="w-4 h-4 mr-2" />
                                      Desfazer Alterações
                                    </Button>
                                  )}
                                    <Button type="submit" disabled={isSubmitting || !isDirty}>
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                        Salvar Alterações
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

// Componente para controlar a agenda de um dia
const DayScheduleControl = ({ dia, control, locais, errors }: any) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `horarios.${dia.key}`
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>{dia.label}</CardTitle>
                {locais.length === 0 && <CardDescription className="text-red-500">Adicione um local de atendimento antes de definir os horários.</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                         <Controller
                            name={`horarios.${dia.key}.${index}`}
                            control={control}
                            render={({ field: controllerField }) => (
                                <>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={controllerField.value.ativo}
                                                onCheckedChange={(checked) => controllerField.onChange({ ...controllerField.value, ativo: checked })}
                                            />
                                            <Label>Atendimento neste bloco</Label>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className={`grid md:grid-cols-3 gap-4 ${!controllerField.value.ativo ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <FormItem>
                                            <Label>Início</Label>
                                            <Input type="time" value={controllerField.value.inicio} onChange={e => controllerField.onChange({...controllerField.value, inicio: e.target.value})} />
                                        </FormItem>
                                        <FormItem>
                                            <Label>Fim</Label>
                                            <Input type="time" value={controllerField.value.fim} onChange={e => controllerField.onChange({...controllerField.value, fim: e.target.value})} />
                                        </FormItem>
                                        <FormItem>
                                            <Label>Local</Label>
                                             <Select value={controllerField.value.local_id ?? ''} onValueChange={value => controllerField.onChange({...controllerField.value, local_id: value})}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {locais.map(local => <SelectItem key={local.id} value={local.id}>{local.nome_local}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    </div>
                                </>
                            )}
                         />
                         {errors.horarios?.[dia.key]?.[index] && <FormMessage className="text-red-500 text-xs">Verifique os horários e o local.</FormMessage>}
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ativo: true, inicio: '08:00', fim: '12:00', local_id: null })} disabled={locais.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Bloco de Horário
                </Button>
            </CardContent>
        </Card>
    );
}

export default GerenciarAgenda;
