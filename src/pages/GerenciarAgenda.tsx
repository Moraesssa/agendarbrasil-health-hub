import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Save, Undo2, Clock, Trash2, Plus, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { logger } from "@/utils/logger";
import locationService, { LocalAtendimento } from "@/services/locationService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Constante movida para o topo ---
const diasDaSemana = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
] as const;

// --- Esquema de Validação Simplificado e Corrigido ---
const horarioSchema = z.object({
  ativo: z.boolean(),
  inicio: z.string(),
  fim: z.string(),
  local_id: z.string().uuid().nullable(),
}).refine(data => {
    if (!data.ativo) return true;
    return !!data.local_id && !!data.inicio && !!data.fim && data.inicio < data.fim;
}, {
  message: "Bloco ativo precisa de local e horário de início anterior ao fim.",
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

// --- Componente Principal ---
const GerenciarAgenda = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locais, setLocais] = useState<LocalAtendimento[]>([]);

    const form = useForm<AgendaFormData>({
        resolver: zodResolver(agendaSchema),
        mode: "onChange",
        defaultValues: {
            horarios: diasDaSemana.reduce((acc, dia) => ({...acc, [dia.key]: []}), {})
        }
    });

    const { reset, handleSubmit, control, formState: { isDirty, isValid } } = form;

    const fetchInitialData = useCallback(async () => {
        if (!user?.id) { setLoading(false); return; }
        setLoading(true);
        try {
            const [locaisData, medicoDataResponse] = await Promise.all([
                locationService.getLocations(),
                supabase.from('medicos').select('configuracoes').eq('user_id', user.id).maybeSingle()
            ]);
            
            setLocais(locaisData || []);

            const medicoConfig = (medicoDataResponse.data?.configuracoes as any) || {};
            const horarioAtendimento = medicoConfig.horarioAtendimento || {};
            
            const horariosCompletos = diasDaSemana.reduce((acc, dia) => {
                acc[dia.key] = horarioAtendimento[dia.key] || [];
                return acc;
            }, {} as Record<string, any>);
            
            reset({ horarios: horariosCompletos });
        } catch (error) {
            logger.error("Erro ao carregar dados da agenda", "GerenciarAgenda", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, reset]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const onSubmit = async (data: AgendaFormData) => {
        if (!user?.id) return;
        setIsSubmitting(true);
        try {
            const { data: medicoData } = await supabase.from('medicos').select('configuracoes').eq('user_id', user.id).maybeSingle();
            const newConfiguracoes = { ...(medicoData?.configuracoes || {}), horarioAtendimento: data.horarios };
            await supabase.from('medicos').update({ configuracoes: newConfiguracoes }).eq('user_id', user.id).throwOnError();
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
                     <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-white/95 px-6">
                        <SidebarTrigger />
                        <h1 className="text-xl font-bold text-gray-800">Meus Horários</h1>
                        {isDirty && <span className="ml-4 text-amber-600 font-medium animate-pulse text-sm">• Alterações não salvas</span>}
                    </header>
                    <main className="p-6">
                        <Form {...form}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
                                {diasDaSemana.map((dia) => (
                                    <DayScheduleControl key={dia.key} dia={dia} control={control} locais={locais} />
                                ))}
                                <div className="flex justify-end items-center gap-4 pt-4 mt-6 border-t">
                                   {isDirty && <Button type="button" variant="ghost" onClick={() => fetchInitialData()}><Undo2 className="w-4 h-4 mr-2" /> Desfazer</Button>}
                                   <Button type="submit" disabled={isSubmitting || !isDirty || !isValid}>
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

const DayScheduleControl = ({ dia, control, locais }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: `horarios.${dia.key}` });

    return (
        <Card>
            <CardHeader><CardTitle>{dia.label}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {fields.length === 0 && <p className="text-sm text-gray-500">Nenhum bloco de horário para este dia.</p>}
                {fields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-3 bg-slate-50 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Controller name={`horarios.${dia.key}.${index}`} control={control} render={({ field, fieldState }) => (
                            <div className="space-y-4">
                                <FormItem className="flex items-center gap-2 pt-2">
                                    <Switch checked={field.value.ativo} onCheckedChange={(checked) => field.onChange({ ...field.value, ativo: checked })} />
                                    <Label>Ativo</Label>
                                </FormItem>
                                <div className={`grid md:grid-cols-3 gap-4 ${!field.value.ativo ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <FormItem><Label>Início</Label><Input type="time" value={field.value.inicio} onChange={e => field.onChange({ ...field.value, inicio: e.target.value })} /></FormItem>
                                    <FormItem><Label>Fim</Label><Input type="time" value={field.value.fim} onChange={e => field.onChange({ ...field.value, fim: e.target.value })} /></FormItem>
                                    <FormItem>
                                        <Label>Local</Label>
                                        <Select onValueChange={val => field.onChange({ ...field.value, local_id: val })} value={field.value.local_id || ''}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {locais.map((local: LocalAtendimento) => <SelectItem key={local.id} value={local.id}>{local.nome_local}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                </div>
                                {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                            </div>
                        )} />
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ativo: !(dia.key === 'sabado' || dia.key === 'domingo'), inicio: '08:00', fim: '12:00', local_id: null })} disabled={locais.length === 0}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Bloco
                </Button>
            </CardContent>
            {locais.length === 0 && (
                <CardFooter>
                    <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Você precisa cadastrar um local em "Meus Locais" antes de adicionar horários.
                    </p>
                </CardFooter>
            )}
        </Card>
    );
}

export default GerenciarAgenda;
