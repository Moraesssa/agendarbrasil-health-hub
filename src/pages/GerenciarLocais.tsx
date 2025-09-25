import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Edit,
  Layers3,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { WorkspaceHeader } from "@/components/doctor/management/WorkspaceHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageLoader } from "@/components/PageLoader";
import { EnderecoForm } from "@/components/onboarding/forms/EnderecoForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import locationService, { LocalAtendimento } from "@/services/locationService";
import { supabase } from "@/integrations/supabase/client";

interface LocationPayload {
  nome_local: string;
  telefone?: string;
  endereco: LocalAtendimento["endereco"];
}

const getStatusBadge = (ativo: boolean | undefined) => {
  if (ativo === false) {
    return <Badge variant="destructive">Inativo</Badge>;
  }
  return (
    <Badge variant="default" className="bg-emerald-100 text-emerald-700 border border-emerald-200">
      Ativo
    </Badge>
  );
};

const GerenciarLocais = () => {
  const [locais, setLocais] = useState<LocalAtendimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedLocal, setSelectedLocal] = useState<LocalAtendimento | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchLocais = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await locationService.getLocations();
      setLocais(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar locais";
      toast({ title: "Erro ao buscar locais", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setLocais([]);
      setIsLoading(false);
      return;
    }

    void fetchLocais();
  }, [authLoading, user?.id, fetchLocais]);

  const metrics = useMemo(() => {
    const total = locais.length;
    const active = locais.filter((local) => local.ativo !== false).length;
    const inactive = total - active;
    const cities = new Set(
      locais
        .map((local) => local.endereco?.cidade)
        .filter((value): value is string => Boolean(value))
    );

    const facilityCodes = new Set<string>();
    locais.forEach((local) => {
      const raw = (local as any)?.facilidades;
      if (Array.isArray(raw)) {
        raw.forEach((facility: any) => {
          if (facility && typeof facility === "object" && "type" in facility) {
            facilityCodes.add(String(facility.type));
          } else if (typeof facility === "string") {
            facilityCodes.add(facility);
          }
        });
      }
    });

    return {
      total,
      active,
      inactive,
      cities: cities.size,
      facilityTypes: facilityCodes.size,
    };
  }, [locais]);

  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    setSelectedLocal(null);
    setIsDialogOpen(true);
  };

  const handleSubmitLocal = async (payload: LocationPayload) => {
    try {
      const normalizedName = payload.nome_local.trim();
      if (!normalizedName) {
        toast({ title: "Informe o nome do local", variant: "destructive" });
        return;
      }

      if (dialogMode === "edit" && selectedLocal) {
        const { error } = await supabase
          .from("locais_atendimento")
          .update({
            nome_local: normalizedName,
            telefone: payload.telefone || null,
            endereco: payload.endereco as any,
            ativo: selectedLocal.ativo,
          })
          .eq("id", selectedLocal.id);

        if (error) {
          throw error;
        }

        toast({ title: "Local atualizado com sucesso!" });
      } else {
        await locationService.addLocation({
          nome_local: normalizedName,
          telefone: payload.telefone,
          endereco: payload.endereco,
        });
        toast({ title: "Local adicionado com sucesso!" });
      }

      setIsDialogOpen(false);
      void fetchLocais();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar local";
      toast({ title: "Erro ao salvar local", description: errorMessage, variant: "destructive" });
    }
  };

  const handleEditLocal = (local: LocalAtendimento) => {
    setDialogMode("edit");
    setSelectedLocal(local);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    void fetchLocais();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <WorkspaceHeader />
        <div className="max-w-7xl mx-auto px-6 py-24">
          <PageLoader message="Carregando locais..." />
        </div>
      </div>
    );
  }

  const heroMetrics = [
    {
      label: "Locais ativos",
      value: metrics.active,
      helper: metrics.active ? "Prontos para agendamentos" : "Cadastre seus primeiros locais",
      icon: Building2,
    },
    {
      label: "Cidades atendidas",
      value: metrics.cities,
      helper: metrics.cities ? "Cobertura geográfica" : "Informe cidade e UF em cada local",
      icon: MapPin,
    },
    {
      label: "Tipos de facilidades",
      value: metrics.facilityTypes,
      helper: metrics.facilityTypes ? "Diferenciais destacados" : "Cadastre facilidades para destacar seu serviço",
      icon: Layers3,
    },
    {
      label: "Locais inativos",
      value: metrics.inactive,
      helper: metrics.inactive ? "Revise para reativar" : "Todos os locais estão ativos",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <WorkspaceHeader
        actions={
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
            <Button size="sm" onClick={handleOpenCreateDialog}>
              <Plus className="w-4 h-4 mr-2" /> Novo local
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-blue-900">
                Organize seus locais de atendimento
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Mantenha endereço, canais de contato e facilidades sempre atualizados para orientar os pacientes
                durante o agendamento e no dia da consulta.
              </CardDescription>
              <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                <span>Locais ativos garantem que os pacientes encontrem você com facilidade.</span>
              </div>
            </div>
            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => navigate("/gerenciar-agenda")} className="flex-1">
                Gerenciar horários
              </Button>
              <Button onClick={handleOpenCreateDialog} className="flex-1">
                <Plus className="w-4 h-4 mr-2" /> Adicionar local
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
          <div className="space-y-4">
            {locais.length === 0 ? (
              <Card className="border border-dashed border-blue-300 bg-blue-50/60">
                <CardContent className="p-10 text-center space-y-3 text-blue-900">
                  <MapPin className="w-12 h-12 mx-auto" />
                  <CardTitle className="text-xl">Nenhum local cadastrado</CardTitle>
                  <CardDescription className="text-blue-800">
                    Cadastre seu primeiro local para disponibilizar consultas presenciais e híbridas.
                  </CardDescription>
                  <Button onClick={handleOpenCreateDialog} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar local
                  </Button>
                </CardContent>
              </Card>
            ) : (
              locais.map((local) => (
                <Card key={local.id} className="shadow-sm border border-slate-200">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        {local.nome_local}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-600">
                        {local.endereco?.logradouro}, {local.endereco?.numero}
                        {local.endereco?.complemento && `, ${local.endereco?.complemento}`}
                      </CardDescription>
                      <div className="text-xs text-slate-500 mt-1">
                        {local.endereco?.bairro} · {local.endereco?.cidade}/{local.endereco?.uf} · CEP {local.endereco?.cep}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(local.ativo)}
                      <Button variant="ghost" size="sm" onClick={() => handleEditLocal(local)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    {local.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span>{local.telefone}</span>
                      </div>
                    )}
                    {(local as any)?.instrucoes_acesso && (
                      <Alert className="border border-slate-200 bg-slate-50 text-slate-700">
                        <AlertTitle className="text-sm font-semibold">Instruções de acesso</AlertTitle>
                        <AlertDescription className="text-xs text-slate-600">
                          {(local as any).instrucoes_acesso}
                        </AlertDescription>
                      </Alert>
                    )}
                    {(local as any)?.facilidades && Array.isArray((local as any).facilidades) && (
                      <div className="flex flex-wrap gap-2">
                        {(local as any).facilidades.map((facility: any, index: number) => {
                          const label = facility?.type || facility;
                          return (
                            <Badge key={`${local.id}-facility-${index}`} variant="secondary" className="text-xs">
                              {String(label)}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <aside className="space-y-6">
            <Card className="border border-blue-100 bg-blue-50/60">
              <CardHeader className="space-y-1">
                <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Dicas para destacar seus locais
                </CardTitle>
                <CardDescription className="text-blue-800">
                  Informações completas aumentam a confiança do paciente na hora da escolha.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-900/90">
                <div className="flex gap-2">
                  <span className="mt-1 text-blue-600">•</span>
                  <p>Inclua telefone ou WhatsApp para facilitar o contato direto com a recepção.</p>
                </div>
                <div className="flex gap-2">
                  <span className="mt-1 text-blue-600">•</span>
                  <p>Descreva facilidades como estacionamento, acessibilidade ou laboratórios parceiros.</p>
                </div>
                <div className="flex gap-2">
                  <span className="mt-1 text-blue-600">•</span>
                  <p>Utilize instruções de acesso para orientar pacientes sobre portaria, elevadores ou referências.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sincronização com a agenda</CardTitle>
                <CardDescription>
                  Garanta que cada local esteja vinculado aos blocos de atendimento certos na sua agenda semanal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">Locais cadastrados</p>
                    <p className="text-xs text-slate-500">
                      Cadastre pelo menos um local ativo para liberar agendamentos presenciais.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {metrics.total}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">Integração com horários</p>
                    <p className="text-xs text-slate-500">
                      Vincule blocos de disponibilidade aos locais corretos para evitar conflitos.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/gerenciar-agenda")}>Editar agenda</Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Editar local de atendimento" : "Adicionar novo local"}
            </DialogTitle>
          </DialogHeader>
          <LocationForm
            mode={dialogMode}
            initialData={selectedLocal}
            onSubmit={handleSubmitLocal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface LocationFormProps {
  mode: "create" | "edit";
  initialData: LocalAtendimento | null;
  onSubmit: (payload: LocationPayload) => void;
}

const LocationForm = ({ mode, initialData, onSubmit }: LocationFormProps) => {
  const [nomeLocal, setNomeLocal] = useState(initialData?.nome_local ?? "");
  const [telefone, setTelefone] = useState(initialData?.telefone ?? "");
  const { toast } = useToast();

  useEffect(() => {
    setNomeLocal(initialData?.nome_local ?? "");
    setTelefone(initialData?.telefone ?? "");
  }, [initialData]);

  const handleNext = (data: any) => {
    if (!nomeLocal.trim()) {
      toast({ title: "Informe o nome do local", variant: "destructive" });
      return;
    }
    onSubmit({
      nome_local: nomeLocal,
      telefone: telefone || undefined,
      endereco: data.endereco,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome_local">Nome do local</Label>
          <Input
            id="nome_local"
            placeholder="Clínica Central"
            value={nomeLocal}
            onChange={(event) => setNomeLocal(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone / WhatsApp</Label>
          <Input
            id="telefone"
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
          />
        </div>
      </div>
      <EnderecoForm
        onNext={handleNext}
        initialData={initialData?.endereco}
        submitLabel={mode === "edit" ? "Atualizar local" : "Salvar local"}
      />
    </div>
  );
};

export default GerenciarLocais;
