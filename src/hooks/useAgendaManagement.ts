
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agendaSchema, AgendaFormData, diasDaSemana } from "@/types/agenda";
import { useAgendaValidation } from "./agenda/useAgendaValidation";
import { useAgendaData } from "./agenda/useAgendaData";
import { useAgendaSubmit } from "./agenda/useAgendaSubmit";
import { logger } from '@/utils/logger';

export const useAgendaManagement = () => {
    const form = useForm<AgendaFormData>({
        resolver: zodResolver(agendaSchema),
        mode: "onChange",
        defaultValues: {
            horarios: diasDaSemana.reduce((acc, dia) => ({...acc, [dia.key]: []}), {})
        }
    });

    const { reset, handleSubmit, control, formState: { isDirty } } = form;
    
    const { hasAnyFilledBlocks, hasValidCompleteBlocks } = useAgendaValidation(control);
    const { loading, locais, error, fetchInitialData } = useAgendaData(reset);
    const { onSubmit, isSubmitting } = useAgendaSubmit(reset);

    const hasFilledBlocks = hasAnyFilledBlocks();
    const canSave = isDirty || hasFilledBlocks;
    const hasCompleteBlocks = hasValidCompleteBlocks();

    logger.debug('Estado atual da agenda', 'useAgendaManagement', {
        canSave,
        hasFilledBlocks,
        hasCompleteBlocks,
        isDirty,
        loading,
        hasError: !!error,
        errorType: error?.type
    });

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
        error,
        fetchInitialData
    };
};
