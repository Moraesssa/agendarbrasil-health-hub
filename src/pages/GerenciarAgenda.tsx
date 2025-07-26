
import { useEffect } from "react";
import { Form } from "@/components/ui/form";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageLoader } from "@/components/PageLoader";
import { useAgendaManagement } from "@/hooks/useAgendaManagement";
import { AgendaPageHeader } from "@/components/agenda/AgendaPageHeader";
import { DayScheduleControl } from "@/components/agenda/DayScheduleControl";
import { AgendaFormActions } from "@/components/agenda/AgendaFormActions";
import { AgendaErrorState } from "@/components/agenda/AgendaErrorState";
import { diasDaSemana } from "@/types/agenda";

const GerenciarAgenda = () => {
    const {
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
    } = useAgendaManagement();

    useEffect(() => { 
        fetchInitialData(); 
    }, [fetchInitialData]);

    if (loading) return <PageLoader message="Carregando sua agenda..." />;

    // Exibir estado de erro se houver algum problema
    if (error) {
        return (
            <SidebarProvider>
                <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
                    <AppSidebar />
                    <SidebarInset className="flex-1">
                        <AgendaErrorState error={error} onRetry={fetchInitialData} />
                    </SidebarInset>
                </div>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
                <AppSidebar />
                <SidebarInset className="flex-1">
                    <AgendaPageHeader 
                        canSave={canSave} 
                        isDirty={isDirty} 
                        hasCompleteBlocks={hasCompleteBlocks}
                    />
                    <main className="p-6">
                        <Form {...form}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
                                {diasDaSemana.map((dia) => (
                                    <DayScheduleControl key={dia.key} dia={dia} control={control} locais={locais} />
                                ))}
                                <AgendaFormActions 
                                    isDirty={isDirty}
                                    canSave={canSave}
                                    isSubmitting={isSubmitting}
                                    onUndo={fetchInitialData}
                                />
                            </form>
                        </Form>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default GerenciarAgenda;
