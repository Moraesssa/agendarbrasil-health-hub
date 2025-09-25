import { Fragment } from "react";
import { GraduationCap, Shield, Stethoscope, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DoctorProfileTabsProps } from "./types";
import { DoctorScheduleDay } from "@/types/user";

const dayLabels: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

const InfoRow = ({ label, value }: { label: string; value: string | null }) => (
  <div className="space-y-1 rounded-lg border border-blue-100/70 bg-white/70 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{label}</p>
    <p className="text-sm text-slate-700">{value ?? "Não informado"}</p>
  </div>
);

const renderSchedule = (horarioAtendimento?: Record<string, DoctorScheduleDay | undefined>) => {
  if (!horarioAtendimento || Object.keys(horarioAtendimento).length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-blue-100 p-8 text-center text-sm text-slate-500">
        Configure sua disponibilidade semanal para facilitar os agendamentos automáticos.
      </div>
    );
  }

  const dayOrder = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
  const entries = Object.entries(horarioAtendimento).sort((a, b) => {
    const indexA = dayOrder.indexOf(a[0].toLowerCase());
    const indexB = dayOrder.indexOf(b[0].toLowerCase());
    if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="space-y-3">
      {entries.map(([day, config]) => {
        const label = dayLabels[day.toLowerCase()] ?? day;
        const isActive = config?.ativo ?? false;
        const start = config?.inicio ?? "--:--";
        const end = config?.fim ?? "--:--";

        return (
          <div
            key={day}
            className="flex flex-col gap-3 rounded-lg border border-blue-100/70 bg-white/70 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-50 text-blue-700">{label}</Badge>
              <span className="text-sm font-medium text-slate-700">
                {isActive ? "Disponível" : "Indisponível"}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              {isActive ? (
                <span>
                  {start} às {end}
                </span>
              ) : (
                <span>Sem atendimento neste dia</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LoadingState = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <Skeleton key={`tab-skeleton-${index}`} className="h-16 w-full rounded-lg" />
    ))}
  </div>
);

const formatAddress = (doctor: DoctorProfileTabsProps["doctor"]) => {
  const endereco = doctor?.endereco;
  if (!endereco) return null;

  const parts = [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade && endereco.uf ? `${endereco.cidade} - ${endereco.uf}` : endereco.cidade ?? endereco.uf,
    endereco.cep,
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));

  return parts.length > 0 ? parts.join(", ") : null;
};

export const DoctorProfileTabs = ({ doctor, loading }: DoctorProfileTabsProps) => {
  const professionalData = doctor?.dadosProfissionais;
  const schedule = doctor?.configuracoes?.horarioAtendimento ?? undefined;
  const specialties = Array.isArray(doctor?.especialidades)
    ? doctor?.especialidades.filter((value) => typeof value === 'string' && value.trim().length > 0)
    : [];
  const primarySpecialty =
    professionalData?.especialidadePrincipal && professionalData.especialidadePrincipal.trim().length > 0
      ? professionalData.especialidadePrincipal
      : specialties[0] ?? null;
  const additionalSpecialties = specialties.slice(1).join(', ');

  return (
    <Card className="border border-blue-100/80 bg-white/80 shadow-sm">
      <CardContent className="p-6">
        <Tabs defaultValue="profissional" className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-blue-50/70 p-1">
            <TabsTrigger value="profissional" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
              <Stethoscope className="mr-2 h-4 w-4" /> Informações profissionais
            </TabsTrigger>
            <TabsTrigger value="formacao" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
              <GraduationCap className="mr-2 h-4 w-4" /> Formação e experiência
            </TabsTrigger>
            <TabsTrigger value="horarios" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
              <ClockIcon /> Horários de atendimento
            </TabsTrigger>
            <TabsTrigger value="consultas" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
              <Users className="mr-2 h-4 w-4" /> Consultas agendadas
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
              <Shield className="mr-2 h-4 w-4" /> Avaliações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profissional" className="space-y-4">
            {loading ? (
              <LoadingState />
            ) : (
              <Fragment>
                <InfoRow label="Nome completo" value={professionalData?.nomeCompleto ?? doctor?.displayName ?? null} />
                <InfoRow label="Especialidade principal" value={primarySpecialty} />
                <InfoRow label="Especialidades adicionais" value={additionalSpecialties.length > 0 ? additionalSpecialties : null} />
                <InfoRow label="CRM" value={doctor?.crm ?? null} />
                <InfoRow label="Telefone" value={doctor?.telefone ?? doctor?.whatsapp ?? null} />
                <InfoRow label="E-mail" value={doctor?.email ?? null} />
                <InfoRow label="Endereço do consultório" value={formatAddress(doctor)} />
              </Fragment>
            )}
          </TabsContent>

          <TabsContent value="formacao" className="space-y-4">
            {loading ? (
              <LoadingState />
            ) : (
              <div className="space-y-4">
                <InfoRow label="Formação" value={professionalData?.formacao ?? null} />
                <InfoRow label="Instituição" value={professionalData?.instituicao ?? null} />
                <InfoRow
                  label="Ano de formação"
                  value={professionalData?.anoFormacao ? String(professionalData.anoFormacao) : null}
                />
                <InfoRow label="Biografia" value={professionalData?.biografia ?? null} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="horarios" className="space-y-4">
            {loading ? <LoadingState /> : renderSchedule(schedule)}
          </TabsContent>

          <TabsContent value="consultas" className="space-y-4">
            {loading ? (
              <LoadingState />
            ) : (
              <div className="rounded-lg border border-blue-100/70 bg-white/70 p-6 text-sm text-slate-600">
                <p className="mb-2 font-semibold text-slate-800">Como os pacientes encontram sua agenda?</p>
                <p>
                  Sua agenda sincroniza automaticamente com as consultas confirmadas e bloqueios. Use o menu de links rápidos para
                  revisar solicitações pendentes e ajustar horários em tempo real.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="avaliacoes" className="space-y-4">
            {loading ? (
              <LoadingState />
            ) : (
              <div className="rounded-lg border border-blue-100/70 bg-white/70 p-6 text-sm text-slate-600">
                <p className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Índice de satisfação
                </p>
                <p>
                  As avaliações dos pacientes serão exibidas aqui assim que começarem a ser coletadas. Incentive seus pacientes a
                  compartilharem feedbacks para acompanhar a qualidade do atendimento.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ClockIcon = () => <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
