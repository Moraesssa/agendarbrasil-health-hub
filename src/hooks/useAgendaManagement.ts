import { useState, useCallback } from "react";
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

    const form = useForm<AgendaFormData>({
        resolver: zodResolver(agendaSchema),
        mode: "onChange",
        defaultValues: {
            horarios: diasDaSemana.reduce((acc, dia) => ({...acc, [dia.key]: []}), {})
        }
    });

    const { reset, handleSubmit, control, formState: { isDirty } } = form;
    
    // Watch all form values to check for any filled blocks
    const watchedValues = useWatch({ control, name: "horarios" });

    // Function to check if there are any filled blocks (at least one field filled)
    const hasAnyFilledBlocks = useCallback(() => {
        console.log("🔍 hasAnyFilledBlocks - watchedValues:", watchedValues);
        
        if (!watchedValues || typeof watchedValues !== 'object') {
            console.log("❌ hasAnyFilledBlocks - watchedValues is invalid");
            return false;
        }
        
        let filledBlocksFound = 0;
        
        for (const dia of diasDaSemana) {
            const blocosDoDia = watchedValues[dia.key];
            console.log(`🔍 Verificando ${dia.label} (${dia.key}):`, blocosDoDia);
            
            if (Array.isArray(blocosDoDia)) {
                const filledBlocks = blocosDoDia.filter((bloco: any) => {
                    const hasAtivo = bloco?.ativo === true;
                    const hasLocalId = bloco?.local_id && bloco.local_id !== null && bloco.local_id !== '';
                    const hasInicio = bloco?.inicio && bloco.inicio !== '';
                    const hasFim = bloco?.fim && bloco.fim !== '';
                    
                    // Consider a block "filled" if it has ANY field filled
                    const isFilled = hasAtivo || hasLocalId || hasInicio || hasFim;
                    
                    console.log(`   📦 Bloco:`, {
                        ativo: hasAtivo,
                        local_id: bloco?.local_id,
                        inicio: bloco?.inicio,
                        fim: bloco?.fim,
                        hasLocalId,
                        hasInicio,
                        hasFim,
                        isFilled
                    });
                    
                    return isFilled;
                });
                
                filledBlocksFound += filledBlocks.length;
                console.log(`   ✅ ${dia.label}: ${filledBlocks.length} blocos preenchidos`);
            }
        }
        
        const result = filledBlocksFound > 0;
        console.log(`🎯 hasAnyFilledBlocks resultado: ${result} (${filledBlocksFound} blocos preenchidos encontrados)`);
        return result;
    }, [watchedValues]);

    // Check if there are valid complete blocks for validation messages
    const hasValidCompleteBlocks = useCallback(() => {
        if (!watchedValues || typeof watchedValues !== 'object') {
            return false;
        }
        
        for (const dia of diasDaSemana) {
            const blocosDoDia = watchedValues[dia.key];
            if (Array.isArray(blocosDoDia)) {
                const validBlocks = blocosDoDia.filter((bloco: any) => {
                    const isActive = bloco?.ativo === true;
                    const hasLocalId = bloco?.local_id && bloco.local_id !== null && bloco.local_id !== '';
                    const hasInicio = bloco?.inicio && bloco.inicio !== '';
                    const hasFim = bloco?.fim && bloco.fim !== '';
                    const validTime = hasInicio && hasFim && bloco.inicio < bloco.fim;
                    
                    return isActive && hasLocalId && validTime;
                });
                
                if (validBlocks.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }, [watchedValues]);

    const canSave = hasAnyFilledBlocks();
    const hasCompleteBlocks = hasValidCompleteBlocks();
    console.log("🚀 canSave:", canSave, "hasCompleteBlocks:", hasCompleteBlocks);

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

    const onSubmit = async (data: AgendaFormData) => {
        console.log("🔥 onSubmit called with data:", data);
        
        if (!user?.id) {
            console.log("❌ No user ID");
            return;
        }
        
        // Custom validation for active blocks only
        let hasValidActiveBlocks = false;
        let incompleteBlocks = [];
        
        for (const dia of diasDaSemana) {
            const blocosDoDia = data.horarios[dia.key];
            if (Array.isArray(blocosDoDia)) {
                for (let i = 0; i < blocosDoDia.length; i++) {
                    const bloco = blocosDoDia[i];
                    if (bloco.ativo) {
                        if (!bloco.local_id || !bloco.inicio || !bloco.fim || bloco.inicio >= bloco.fim) {
                            console.log("❌ Bloco ativo inválido encontrado:", bloco);
                            incompleteBlocks.push(`${dia.label} - Bloco ${i + 1}`);
                        } else {
                            hasValidActiveBlocks = true;
                        }
                    }
                }
            }
        }

        if (incompleteBlocks.length > 0) {
            console.log("⚠️ Blocos incompletos encontrados:", incompleteBlocks);
            toast({ 
                title: "Blocos incompletos encontrados", 
                description: `Os seguintes blocos ativos precisam ser completados: ${incompleteBlocks.join(', ')}. Preencha todos os campos obrigatórios (local, horário de início e fim).`,
                variant: "destructive" 
            });
            return;
        }

        if (!hasValidActiveBlocks) {
            console.log("❌ Nenhum bloco ativo válido encontrado");
            toast({ 
                title: "Nenhum horário ativo configurado", 
                description: "É necessário ter pelo menos um bloco ativo e completamente preenchido para salvar.",
                variant: "destructive" 
            });
            return;
        }

        console.log("✅ Validação passou, iniciando save...");
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

            console.log("✅ Dados salvos com sucesso!");
            toast({ title: "Agenda atualizada com sucesso!" });
            reset(data);
        } catch (error) {
            console.log("❌ Erro ao salvar:", error);
            logger.error("Erro ao salvar agenda", "GerenciarAgenda", error);
            toast({ title: "Erro ao salvar agenda", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

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
        hasCompleteBlocks,
        fetchInitialData
    };
};
