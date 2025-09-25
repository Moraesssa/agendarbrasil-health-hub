import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  Undo2,
} from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/PageLoader";
import { WorkspaceHeader } from "@/components/doctor/management/WorkspaceHeader";
import { useAgendaManagement } from "@/hooks/useAgendaManagement";
import { AgendaErrorState } from "@/components/agenda/AgendaErrorState";
import { DayScheduleControl } from "@/components/agenda/DayScheduleControl";
import { AgendaFormActions } from "@/components/agenda/AgendaFormActions";
import { diasDaSemana } from "@/types/agenda";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  synced: "bg-slate-100 text-slate-700 border border-slate-200",
  ready: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
};

const GerenciarAgenda = () => {
  const {
    form,
    control,
    handleSubmit,
    onSubmit,
    loading,
    isSubmitting,
    locais,
    hasChanges,
    canSave,
    hasCompleteBlocks,
    error,
    fetchInitialData,
  } = useAgendaManagement();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const horarios = form.watch("horarios");

  const metrics = useMemo(() => {
    let totalBlocks = 0;
    let activeBlocks = 0;
    let daysConfigured = 0;
    let lunchBreaks = 0;

    diasDaSemana.forEach((dia) => {
      const blocos = Array.isArray(horarios?.[dia.key]) ? horarios?.[dia.key] ?? [] : [];
      if (blocos.length > 0) {
        daysConfigured += 1;
      }
      blocos.forEach((bloco) => {
        totalBlocks += 1;
        if (bloco?.ativo) {
          activeBlocks += 1;
        }
        if (bloco?.inicioAlmoco && bloco?.fimAlmoco) {
          lunchBreaks += 1;
        }
      });
    });

    return {
      totalBlocks,
      activeBlocks,
      daysConfigured,
      lunchBreaks,
      locationsCount: locais?.length ?? 0,
    };
  }, [horarios, locais?.length]);

  const statusConfig = useMemo(() => {
    if (!hasChanges) {
      return {
        key: "synced",
        label: "Agenda sincronizada",
        description: "As disponibilidades atuais já estão visíveis para os pacientes.",
      } as const;
    }

    if (hasCompleteBlocks && canSave) {
      return {
        key: "ready",
        label: "Alterações prontas para salvar",
        description: "Revise e confirme para publicar seus novos horários.",
      } as const;
    }

    return {
      key: "warning",
      label: "Revise antes de salvar",
      description: "Complete os blocos ativos e defina locais válidos para cada dia.",
    } as const;
  }, [hasChanges, hasCompleteBlocks, canSave]);

  const handleSave = () => {
    void handleSubmit(onSubmit)();
  };

  const handleReset = () => {
    fetchInitialData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <WorkspaceHeader />
        <div className="max-w-7xl mx-auto px-6 py-24">
          <PageLoader message="Carregando sua agenda..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <WorkspaceHeader />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <AgendaErrorState error={error} onRetry={fetchInitialData} />
        </main>
      </div>
    );
  }

  const heroMetrics = [
    {
      label: "Blocos ativos",
      value: metrics.activeBlocks,
      icon: Clock,
      helper: metrics.totalBlocks
        ? `${metrics.totalBlocks} blocos configurados no total`
        : "Nenhum bloco configurado ainda",
    },
    {
      label: "Dias configurados",
      value: metrics.daysConfigured,
      icon: CalendarCheck,
      helper: metrics.daysConfigured
        ? "Dias com disponibilidade publicada"
        : "Configure disponibilidade para começar",
    },
    {
      label: "Locais vinculados",
      value: metrics.locationsCount,
      icon: MapPin,
      helper: metrics.locationsCount
        ? "Locais prontos para receber consultas"
        : "Cadastre pelo menos um local",
    },
    {
      label: "Intervalos de almoço",
      value: metrics.lunchBreaks,
      icon: ShieldCheck,
      helper: metrics.lunchBreaks
        ? "Blocos com pausa configurada"
        : "Defina pausas para organizar sua rotina",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <WorkspaceHeader
        actions={
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSubmitting || !hasChanges}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Desfazer
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!canSave || isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              Salvar agenda
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <Card className="shadow-sm border border-slate-200/80">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-blue-900">
                Configure sua disponibilidade de atendimento
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Mantenha horários, locais e bloqueios atualizados para que os pacientes encontrem facilmente
                os melhores momentos para consultar com você.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={cn("px-3 py-1 text-xs", STATUS_STYLES[statusConfig.key])}>
                  {statusConfig.label}
                </Badge>
                <span className="text-sm text-slate-500">
                  {statusConfig.description}
                </span>
              </div>
            </div>
            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/gerenciar-locais")}
                className="flex-1"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Sincronizar locais
              </Button>
              <Button onClick={handleSave} disabled={!canSave || isSubmitting} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Publicar alterações
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <metric.icon className="w-4 h-4 text-blue-500" />
                  {metric.label}
                </div>
                <div className="text-2xl font-semibold text-slate-900">{metric.value}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{metric.helper}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="shadow-sm border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Agenda semanal</CardTitle>
                    <CardDescription>
                      Defina blocos de disponibilidade para cada dia da semana e conecte-os aos locais corretos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {diasDaSemana.map((dia) => (
                      <DayScheduleControl key={dia.key} dia={dia} control={control} locais={locais} />
                    ))}
                  </CardContent>
                </Card>

                <AgendaFormActions
                  hasChanges={hasChanges}
                  canSave={canSave}
                  isSubmitting={isSubmitting}
                  onUndo={handleReset}
                />
              </form>
            </Form>
          </div>

          <aside className="space-y-6">
            <Card className="border border-blue-100 bg-blue-50/60">
              <CardHeader className="space-y-1">
                <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Boas práticas de agenda
                </CardTitle>
                <CardDescription className="text-blue-800">
                  Dicas rápidas para manter sua disponibilidade organizada e eficiente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-900/90">
                <div className="flex gap-2">
                  <span className="mt-1 text-blue-600">•</span>
                  <p>Defina pausas estratégicas para almoço e imprevistos.</p>
                </div>
                <div className="flex gap-2">
                  <span className="mt-1 text-blue-600">•</span>
                  <p>Mantenha horários padronizados entre os locais para facilitar remanejamentos.</p>
                </div>
                <div className="flex gap-2">
                  <span className="mt-1 text-blue-600">•</span>
                  <p>Revise a agenda semanalmente para garantir que bloqueios temporários estejam atualizados.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Resumo rápido</CardTitle>
                <CardDescription>
                  Um panorama da sua disponibilidade atual para garantir que tudo esteja pronto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">Locais configurados</p>
                    <p className="text-xs text-slate-500">
                      Vincule blocos aos locais corretos para evitar conflitos.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {metrics.locationsCount}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">Dias com disponibilidade</p>
                    <p className="text-xs text-slate-500">Espalhe horários entre diferentes dias para distribuir a demanda.</p>
                  </div>
                  <Badge variant="secondary" className="font-medium">
                    {metrics.daysConfigured}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">Blocos aguardando revisão</p>
                    <p className="text-xs text-slate-500">
                      Certifique-se de que todos os blocos ativos possuem local e horários válidos.
                    </p>
                  </div>
                  <Badge variant="destructive" className="font-medium">
                    {Math.max(metrics.totalBlocks - metrics.activeBlocks, 0)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {hasChanges && !hasCompleteBlocks && (
              <Alert variant="destructive" className="border border-amber-200 bg-amber-50 text-amber-900">
                <AlertTitle>Alguns blocos precisam de atenção</AlertTitle>
                <AlertDescription>
                  Revise os blocos marcados como ativos e confirme se os horários de início e fim estão preenchidos corretamente.
                </AlertDescription>
              </Alert>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default GerenciarAgenda;
