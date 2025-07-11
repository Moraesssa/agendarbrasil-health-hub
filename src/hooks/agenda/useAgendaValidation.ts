
import { useCallback } from "react";
import { useWatch, Control } from "react-hook-form";
import { AgendaFormData, diasDaSemana } from "@/types/agenda";

export const useAgendaValidation = (control: Control<AgendaFormData>) => {
    const watchedValues = useWatch({ control, name: "horarios" });

    // Function to check if there are any blocks with ANY field filled
    const hasAnyFilledBlocks = useCallback(() => {
        console.log("🔍 Verificando blocos preenchidos - watchedValues:", watchedValues);
        
        if (!watchedValues || typeof watchedValues !== 'object') {
            console.log("❌ watchedValues é inválido");
            return false;
        }
        
        for (const dia of diasDaSemana) {
            const blocosDoDia = watchedValues[dia.key];
            console.log(`🔍 Verificando ${dia.label} (${dia.key}):`, blocosDoDia);
            
            if (Array.isArray(blocosDoDia) && blocosDoDia.length > 0) {
                for (const bloco of blocosDoDia) {
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
                        isFilled
                    });
                    
                    if (isFilled) {
                        console.log(`✅ Encontrado bloco preenchido em ${dia.label}`);
                        return true;
                    }
                }
            }
        }
        
        console.log(`❌ Nenhum bloco preenchido encontrado`);
        return false;
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

    return {
        hasAnyFilledBlocks,
        hasValidCompleteBlocks,
        watchedValues
    };
};
