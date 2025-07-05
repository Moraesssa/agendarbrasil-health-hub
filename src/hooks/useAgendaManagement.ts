import { useState, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import locationService, { LocalAtendimento } from "@/services/locationService";
import { agendaSchema, AgendaFormData, diasDaSemana } from "@/types/agenda";

export const useAgendaManagement = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locais, setLocais] = useState<LocalAtendimento[]>([]);
    const [medicoConfig, setMedicoConfig] = useState<any>(null);

    const form = useForm<AgendaFormData>({
        resolver: zodResolver(agendaSchema),
        mode: "onChange",
        defaultValues: {
            horarios: diasDaSemana.reduce((acc, dia) => ({...acc, [dia.key]: []}), {})
        }
    });

    const { reset, handleSubmit, control, formState: { isDirty } } = form;
    
    // Watch all form values to check for valid blocks
    const watchedValues = useWatch({ control, name: "horarios" });

    // Function to check if there are any valid blocks
    const hasValidBlocks = useCallback(() => {
        console.log("🔍 hasValidBlocks - watchedValues:", watchedValues);
        
        if (!watchedValues || typeof watchedValues !== 'object') {
            console.log("❌ hasValidBlocks - watchedValues is invalid");
            return false;
        }
        
        let validBlocksFound = 0;
        
        for (const dia of diasDaSemana) {
            const blocosDoDia = watchedValues[dia.key];
            console.log(`🔍 Verificando ${dia.label} (${dia.key}):`, blocosDoDia);
            
            if (Array.isArray(blocosDoDia)) {
                const validBlocks = blocosDoDia.filter((bloco: any) => {
                    const isActive = bloco?.ativo === true;
                    const hasLocalId = bloco?.local_id && bloco.local_id !== null && bloco.local_id !== '';
                    const hasInicio = bloco?.inicio && bloco.inicio !== '';
                    const hasFim = bloco?.fim && bloco.fim !== '';
                    const validTime = hasInicio && hasFim && bloco.inicio < bloco.fim;
                    
                    const isValid = isActive && hasLocalId && validTime;
                    
                    console.log(`   📦 Bloco:`, {
                        ativo: isActive,
                        local_id: bloco?.local_id,
                        inicio: bloco?.inicio,
                        fim: bloco?.fim,
                        hasLocalId,
                        hasInicio,
                        hasFim,
                        validTime,
                        isValid
                    });
                    
                    return isValid;
                });
                
                validBlocksFound += validBlocks.length;
                console.log(`   ✅ ${dia.label}: ${validBlocks.length} blocos válidos`);
            }
        }
        
        const result = validBlocksFound > 0;
        console.log(`🎯 hasValidBlocks resultado: ${result} (${validBlocksFound} blocos válidos encontrados)`);
        return result;
    }, [watchedValues]);

    // Remove dependency on isValid - only check if there are valid blocks
    const canSave = useMemo(() => hasValidBlocks(), [hasValidBlocks]);
    console.log("🚀 canSave:", canSave);

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
                    
                    if (config && typeof config === 'object') {
                       setMedicoConfig(config);
                       if (config.horarioAtendimento) {
                           horarioAtendimento = config.horarioAtendimento;
                       }
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

    const onSubmit = useCallback(async (data: AgendaFormData) => {
        if (!user?.id) return;

        let hasValidActiveBlocks = false;
        for (const dia of diasDaSemana) {
            const blocosDoDia = data.horarios[dia.key];
            if (Array.isArray(blocosDoDia)) {
                for (const bloco of blocosDoDia) {
                    if (bloco.ativo) {
                        if (!bloco.local_id || !bloco.inicio || !bloco.fim || bloco.inicio >= bloco.fim) {
                            toast({
                                title: "Erro de validação",
                                description: `Bloco ativo em ${dia.label} possui dados inválidos.`,
                                variant: "destructive"
                            });
                            return;
                        }
                        hasValidActiveBlocks = true;
                    }
                }
            }
        }

        if (!hasValidActiveBlocks) {
            toast({
                title: "Nenhum horário definido",
                description: "É necessário ter pelo menos um bloco ativo e válido para salvar.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const finalConfig = {
                ...medicoConfig,
                horarioAtendimento: data.horarios,
            };

            await supabase
                .from('medicos')
                .update({ configuracoes: finalConfig })
                .eq('user_id', user.id)
                .throwOnError();

            toast({ title: "Agenda atualizada com sucesso!" });
            reset(data);
        } catch (error) {
            logger.error("Erro ao salvar agenda", "GerenciarAgenda", error);
            toast({ title: "Erro ao salvar agenda", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }, [user?.id, toast, reset, medicoConfig]);

    return {
        form,
        control,
        handleSubmit,
        onSubmit,
        loading,
        isSubmitting,
        locais,
        isDirty,
        canSave,
        fetchInitialData
    };
};
