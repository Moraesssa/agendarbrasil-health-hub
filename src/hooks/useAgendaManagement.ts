
import { useCallback, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
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

    const normalizeHorarios = useCallback((horarios?: AgendaFormData["horarios"]) => {
        return diasDaSemana.reduce((acc, dia) => {
            const blocos = Array.isArray(horarios?.[dia.key]) ? horarios?.[dia.key] ?? [] : [];
            acc[dia.key] = blocos.map((bloco) => ({
                ...bloco,
                local_id: bloco?.local_id === null || bloco?.local_id === ""
                    ? bloco?.local_id ?? null
                    : String(bloco.local_id),
            }));
            return acc;
        }, {} as AgendaFormData["horarios"]);
    }, []);

    const snapshotRef = useRef<string>(JSON.stringify(normalizeHorarios(form.getValues("horarios"))));

    const baseReset = useRef(form.reset);

    const reset = useCallback<typeof form.reset>((values, options) => {
        baseReset.current(values, options);
        const horariosAtualizados = form.getValues("horarios");
        snapshotRef.current = JSON.stringify(normalizeHorarios(horariosAtualizados));
    }, [form, normalizeHorarios]);

    form.reset = reset;

    const { handleSubmit, control, formState: { isDirty } } = form;

    const { hasAnyFilledBlocks, hasValidCompleteBlocks } = useAgendaValidation(control);
    const { loading, locais, error, fetchInitialData } = useAgendaData(reset);
    const { onSubmit, isSubmitting } = useAgendaSubmit(reset);

    const hasFilledBlocks = hasAnyFilledBlocks();
    const horariosAtuais = useWatch({ control, name: "horarios" });
    const normalizedCurrentSnapshot = useMemo(() => (
        JSON.stringify(normalizeHorarios(horariosAtuais))
    ), [horariosAtuais, normalizeHorarios]);

    const hasChanges = normalizedCurrentSnapshot !== snapshotRef.current;
    const canSave = hasChanges;
    const hasCompleteBlocks = hasValidCompleteBlocks();

    logger.debug('Estado atual da agenda', 'useAgendaManagement', {
        canSave,
        hasFilledBlocks,
        hasCompleteBlocks,
        hasChanges,
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
        hasChanges,
        canSave,
        hasCompleteBlocks,
        error,
        fetchInitialData
    };
};
