
import { useState, useCallback } from "react";
import { UseFormReset } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import locationService, { LocalAtendimento } from "@/services/locationService";
import { AgendaFormData, diasDaSemana } from "@/types/agenda";

interface AgendaError {
  type: 'auth' | 'user-type' | 'medico-data' | 'locations' | 'general';
  message: string;
  details?: string;
}

export const useAgendaData = (reset: UseFormReset<AgendaFormData>) => {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [locais, setLocais] = useState<LocalAtendimento[]>([]);
    const [error, setError] = useState<AgendaError | null>(null);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Verificar autenticação
            if (!user?.id) {
                setError({
                    type: 'auth',
                    message: 'Usuário não autenticado',
                    details: 'Faça login para acessar sua agenda'
                });
                setLoading(false);
                return;
            }

            // Verificar se é médico
            if (!userData?.userType || userData.userType !== 'medico') {
                setError({
                    type: 'user-type',
                    message: 'Acesso negado',
                    details: 'Esta funcionalidade é exclusiva para médicos'
                });
                setLoading(false);
                return;
            }

            logger.info("Carregando dados da agenda para médico", "useAgendaData", { userId: user.id });

            // Carregar dados em paralelo
            const [locaisData, medicoData] = await Promise.all([
                locationService.getLocations().catch(err => {
                    logger.warn("Erro ao carregar locais", "useAgendaData", err);
                    return []; // Continua mesmo sem locais
                }),
                supabase.from('medicos').select('configuracoes').eq('user_id', user.id).single()
            ]);
            
            // Verificar se o médico tem dados cadastrados
            if (medicoData.error) {
                if (medicoData.error.code === 'PGRST116') {
                    setError({
                        type: 'medico-data',
                        message: 'Dados médicos não encontrados',
                        details: 'Complete seu cadastro médico antes de configurar sua agenda'
                    });
                } else {
                    logger.error("Erro ao buscar dados do médico", "useAgendaData", medicoData.error);
                    setError({
                        type: 'medico-data',
                        message: 'Erro ao carregar dados médicos',
                        details: medicoData.error.message
                    });
                }
                setLoading(false);
                return;
            }
            
            setLocais(locaisData);

            // Verificar se há locais cadastrados (aviso, não erro)
            if (locaisData.length === 0) {
                toast({
                    title: "Nenhum local cadastrado",
                    description: "Cadastre pelo menos um local de atendimento para configurar sua agenda.",
                    variant: "default"
                });
            }

            // Processar configurações de horário
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
                    logger.error("Erro ao fazer parse das configurações", "useAgendaData", e);
                    // Continua com horário vazio
                }
            }
            
            reset({ horarios: horarioAtendimento });
            logger.info("Dados da agenda carregados com sucesso", "useAgendaData", {
                locaisCount: locaisData.length,
                hasHorarios: Object.keys(horarioAtendimento).length > 0
            });

        } catch (error) {
            logger.error("Erro inesperado ao carregar dados da agenda", "useAgendaData", error);
            setError({
                type: 'general',
                message: 'Erro ao carregar agenda',
                details: error instanceof Error ? error.message : 'Erro desconhecido'
            });
            toast({ 
                title: "Erro ao carregar dados", 
                description: "Tente novamente em alguns instantes",
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    }, [user?.id, userData?.userType, reset, toast]);

    return {
        loading,
        locais,
        error,
        fetchInitialData
    };
};
