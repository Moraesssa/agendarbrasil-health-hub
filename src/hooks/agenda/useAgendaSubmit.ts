
import { useState } from "react";
import { UseFormReset } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { AgendaFormData, diasDaSemana } from "@/types/agenda";

export const useAgendaSubmit = (reset: UseFormReset<AgendaFormData>) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const normalizeHorarios = (horarios: AgendaFormData["horarios"]) => {
        return diasDaSemana.reduce((acc, dia) => {
            const blocos = Array.isArray(horarios[dia.key]) ? horarios[dia.key] : [];
            acc[dia.key] = blocos.map(bloco => ({
                ...bloco,
                local_id: bloco.local_id === null || bloco.local_id === ""
                    ? bloco.local_id
                    : String(bloco.local_id),
            }));
            return acc;
        }, {} as AgendaFormData["horarios"]);
    };

    const onSubmit = async (data: AgendaFormData) => {
        console.log("🔥 onSubmit called with data:", data);

        if (!user?.id) {
            console.log("❌ No user ID");
            return;
        }

        const normalizedHorarios = normalizeHorarios(data.horarios);

        // Custom validation for active blocks only
        const incompleteBlocks = [];
        let hasActiveBlocks = false;

        for (const dia of diasDaSemana) {
            const blocosDoDia = normalizedHorarios[dia.key];
            if (Array.isArray(blocosDoDia)) {
                for (let i = 0; i < blocosDoDia.length; i++) {
                    const bloco = blocosDoDia[i];
                    if (bloco.ativo) {
                        hasActiveBlocks = true;
                        if (!bloco.local_id || !bloco.inicio || !bloco.fim || bloco.inicio >= bloco.fim) {
                            console.log("❌ Bloco ativo inválido encontrado:", bloco);
                            incompleteBlocks.push(`${dia.label} - Bloco ${i + 1}`);
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

        const emptyHorarios = diasDaSemana.reduce((acc, dia) => {
            acc[dia.key] = [];
            return acc;
        }, {} as AgendaFormData["horarios"]);

        const horariosToSave = hasActiveBlocks ? normalizedHorarios : emptyHorarios;

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

            if (!hasActiveBlocks) {
                logger.info("Removendo todos os blocos da agenda", "GerenciarAgenda", { userId: user.id });
            }

            const newConfiguracoes = {
                ...existingConfig,
                horarioAtendimento: horariosToSave
            };

            await supabase.from('medicos').update({ configuracoes: newConfiguracoes }).eq('user_id', user.id).throwOnError();

            console.log("✅ Dados salvos com sucesso!");
            toast({ title: "Agenda atualizada com sucesso!" });
            reset({ horarios: horariosToSave });
        } catch (error) {
            console.log("❌ Erro ao salvar:", error);
            logger.error("Erro ao salvar agenda", "GerenciarAgenda", error);
            toast({ title: "Erro ao salvar agenda", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        onSubmit,
        isSubmitting
    };
};
