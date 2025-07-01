import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
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
  message: "Para blocos ativos, o local é obrigatório e o início deve ser antes do fim.",
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
    
    // Watch all form values to check for valid blocks
    const watchedValues = useWatch({ control, name: "horarios" });

    // Function to check if there are any valid blocks
    const hasValidBlocks = useCallback(() => {
        if (!watchedValues || typeof watchedValues !== 'object') return false;
        
        for (const dia of diasDaSemana) {
            const blocosDoDia = watchedValues[dia.key];
            if (Array.isArray(blocosDoDia)) {
                const hasValidBlock = blocosDoDia.some((bloco: any) => {
                    return bloco?.ativo === true && 
                           bloco?.inicio && 
                           bloco?.fim && 
                           bloco?.local_id && 
                           bloco.inicio < bloco.fim;
                });
                if (hasValidBlock) return true;
            }
        }
        return false;
    }, [watchedValues]);

    const canSave = hasValidBlocks() && isValid;

    const fetchInitialData = useCallback(async () => {
        if (!user?.id) { setLoading(false); return; }
        setLoading(true);
        try {
            const [locaisData, medicoData] = await Promise.all([
                locationService.getLocations(),
                supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single()
            ]);
            
            setLocais(locaisData);

            if (medicoData.error && medicoData.error.code !== 'PGRST116') throw medicoData.error;
            
            // Safe parsing of configurations
            let horarioAtendimento = {};
            if (medicoData.data?.configuracoes) {
                try {
                    const config = typeof medicoData.data.configuracoes === 'string' 
                        ? JSON.parse(medicoData.data.configuracoes) 
                        : medicoData.data.configuracoes;
                    
                    if (config && typeof config === 'object' && config.horarioAtendimento) {
                        horarioAtendimento = config.horarioAtendimento;
                    }
                } catch (e) {
                    logger.error("Erro ao fazer parse das configurações", "GerenciarAgenda", e);
                }
            }
            
            reset({ horarios: horarioAtendimento });
        } catch (error) {
            logger.error("Erro ao carregar dados da agenda", "GerenciarAgenda", error);
            toast({ title: "Erro ao carregar dados", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user?.id, reset, toast]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const onSubmit = async (data: AgendaFormData) => {
        if (!user?.id) return;
        setIsSubmitting(true);
        try {
            const { data: medicoData, error: fetchError } = await supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single();
            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            // Safe parsing and merging of configurations
            let existingConfig = {};
            if (medicoData?.configuracoes) {
                try {
                    existingConfig = typeof medicoData.configuracoes === 'string' 
                        ? JSON.parse(medicoData.configuracoes) 
                        : medicoData.configuracoes;
                } catch (e) {
                    logger.error("Erro ao fazer parse das configurações existentes", "GerenciarAgenda", e);
                }
            }

            const newConfiguracoes = { 
                ...existingConfig, 
                horarioAtendimento: data.horarios 
            };
            
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
                        <div className="flex-1">
                          <h1 className="text-2xl font-bold text-gray-800">Meus Horários</h1>
                          <p className="text-sm text-gray-600">
                              Defina sua disponibilidade e locais para cada dia da semana.
                              {!canSave && <span className="ml-2 text-amber-600 font-medium">• Configure pelo menos um bloco válido para salvar</span>}
                              {isDirty && canSave && <span className="ml-2 text-green-600 font-medium animate-pulse">• Pronto para salvar</span>}
                          </p>
                        </div>
                    </header>
                    <main className="p-6">
                        <Form {...form}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
                                {diasDaSemana.map((dia) => (
                                    <DayScheduleControl key={dia.key} dia={dia} control={control} locais={locais} />
                                ))}
                                <div className="flex justify-end items-center gap-4 pt-4 mt-6 border-t">
                                   {isDirty && (
                                    <Button type="button" variant="ghost" onClick={() => fetchInitialData()}>
                                      <Undo2 className="w-4 h-4 mr-2" /> Desfazer
                                    </Button>
                                  )}
                                    <Button type="submit" disabled={isSubmitting || !canSave}>
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

// --- Componente Secundário ---
const DayScheduleControl = ({ dia, control, locais }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: `horarios.${dia.key}` });

    return (
        <Card>
            <CardHeader><CardTitle>{dia.label}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {fields.length === 0 && <p className="text-sm text-gray-500">Nenhum bloco de horário para este dia.</p>}
                {fields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-3 bg-slate-50 relative">
                        <Controller
                            control={control}
                            name={`horarios.${dia.key}.${index}`}
                            render={({ field: { onChange, value }, fieldState: { error } }) => (
                                <>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Switch checked={value?.ativo || false} onCheckedChange={(checked) => onChange({ ...value, ativo: checked })} />
                                            <Label>Atendimento neste bloco</Label>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className={`grid md:grid-cols-3 gap-4 ${!value?.ativo ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <FormItem>
                                            <Label>Início</Label>
                                            <Input type="time" value={value?.inicio || ''} onChange={e => onChange({...value, inicio: e.target.value})} />
                                        </FormItem>
                                        <FormItem>
                                            <Label>Fim</Label>
                                            <Input type="time" value={value?.fim || ''} onChange={e => onChange({...value, fim: e.target.value})} />
                                        </FormItem>
                                        <FormItem>
                                            <Label>Local</Label>
                                             <Select onValueChange={val => onChange({...value, local_id: val})} value={value?.local_id || undefined}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {locais.map((local: LocalAtendimento) => <SelectItem key={local.id} value={local.id}>{local.nome_local}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    </div>
                                    {error && <FormMessage className="text-xs text-red-500">{error.message}</FormMessage>}
                                </>
                            )}
                         />
                    </div>
                ))}
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ 
                        ativo: !(dia.key === 'sabado' || dia.key === 'domingo'),
                        inicio: '08:00', 
                        fim: '12:00', 
                        local_id: null 
                    })} 
                    disabled={locais.length === 0}
                >
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
