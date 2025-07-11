
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agendaSchema, AgendaFormData, diasDaSemana } from "@/types/agenda";
import { useAgendaValidation } from "./agenda/useAgendaValidation";
import { useAgendaData } from "./agenda/useAgendaData";
import { useAgendaSubmit } from "./agenda/useAgendaSubmit";

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
    const { loading, locais, fetchInitialData } = useAgendaData(reset);
    const { onSubmit, isSubmitting } = useAgendaSubmit(reset);

    const canSave = hasAnyFilledBlocks();
    const hasCompleteBlocks = hasValidCompleteBlocks();
    
    console.log("🚀 Estado atual:", { canSave, hasCompleteBlocks, isDirty });

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
