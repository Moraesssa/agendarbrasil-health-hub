import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BaseUser } from "@/types/user";

const dayLabels: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

const formatAddress = (address?: BaseUser["endereco"] | null) => {
  if (!address) return "Não informado";

  const baseLine = [address.logradouro, address.numero].filter(Boolean).join(", ");
  const locationLine = [address.cidade, address.uf].filter(Boolean).join(" - ");
  const parts = [
    baseLine,
    address.complemento?.trim() || "",
    address.bairro?.trim() || "",
    locationLine,
    address.cep?.trim() || "",
  ].filter((value) => value && value.length > 0);

  return parts.length ? parts.join(" · ") : "Não informado";
};

const getVerificationStatus = (verification?: BaseUser["verificacao"] | null) => {
  if (!verification) return "Não iniciado";
  if (verification.aprovado) return "Aprovado";
  if (verification.crmVerificado) return "CRM verificado";
  if (verification.documentosEnviados) return "Documentos em análise";
  return "Pendente";
};

const getScheduleEntries = (config?: BaseUser["configuracoes"] | null) => {
  if (!config || !config.horarioAtendimento || typeof config.horarioAtendimento !== "object") {
    return [];
  }

  return Object.entries(config.horarioAtendimento)
    .map(([day, value]) => {
      if (!value || typeof value !== "object") {
        return null;
      }

      const dayConfig = value as Record<string, unknown>;

      return {
        id: day,
        label: dayLabels[day] ?? day,
        ativo: Boolean(dayConfig.ativo),
        inicio: typeof dayConfig.inicio === "string" ? dayConfig.inicio : null,
        fim: typeof dayConfig.fim === "string" ? dayConfig.fim : null,
      };
    })
    .filter((entry): entry is {
      id: string;
      label: string;
      ativo: boolean;
      inicio: string | null;
      fim: string | null;
    } => Boolean(entry));
};

interface DoctorProfileTabsProps {
  doctor: BaseUser | null;
  loading?: boolean;
}

export const DoctorProfileTabs = ({ doctor, loading }: DoctorProfileTabsProps) => {
  const specialties = doctor?.especialidades?.length ? doctor.especialidades : [];
  const scheduleEntries = getScheduleEntries(doctor?.configuracoes);
  const verificationStatus = getVerificationStatus(doctor?.verificacao);
  const formattedAddress = formatAddress(doctor?.endereco);
  const convenios = Array.isArray(doctor?.configuracoes?.conveniosAceitos)
    ? doctor.configuracoes.conveniosAceitos.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
      )
    : [];
  const formattedConsultationValue =
    typeof doctor?.configuracoes?.valorConsulta === "number"
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
          doctor.configuracoes.valorConsulta
        )
      : null;

  return (
    <Card id="informacoes" className="border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-900">Informações do profissional</CardTitle>
        <CardDescription>Detalhes gerais e configurações do seu perfil</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sobre" className="w-full">
          <TabsList className="w-full justify-start gap-2 bg-blue-50/60 p-1">
            <TabsTrigger value="sobre" className="rounded-lg px-4 py-2">
              Sobre
            </TabsTrigger>
            <TabsTrigger value="especialidades" className="rounded-lg px-4 py-2">
              Especialidades
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="rounded-lg px-4 py-2">
              Preferências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sobre" className="mt-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-600">Nome completo</dt>
                  <dd className="text-slate-900">{doctor?.displayName ?? "Não informado"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Email</dt>
                  <dd className="text-slate-900">{doctor?.email ?? "Não informado"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">CRM</dt>
                  <dd className="text-slate-900">{doctor?.crm ?? "Não informado"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Status do onboarding</dt>
                  <dd className="text-slate-900">
                    {doctor?.onboardingCompleted ? "Concluído" : "Pendente"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Telefone</dt>
                  <dd className="text-slate-900">{doctor?.telefone ?? "Não informado"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">WhatsApp</dt>
                  <dd className="text-slate-900">{doctor?.whatsapp ?? "Não informado"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-slate-600">Endereço principal</dt>
                  <dd className="text-slate-900">{formattedAddress}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Verificação</dt>
                  <dd className="text-slate-900">{verificationStatus}</dd>
                </div>
              </dl>
            )}
          </TabsContent>

          <TabsContent value="especialidades" className="mt-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : specialties.length ? (
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {specialties.map((specialty) => (
                  <li
                    key={specialty}
                    className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-blue-700"
                  >
                    {specialty}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma especialidade cadastrada no momento.
              </p>
            )}
          </TabsContent>

          <TabsContent value="preferencias" className="mt-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : (
              <div className="space-y-6 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Preferências da conta</p>
                  {doctor?.preferences ? (
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="font-medium text-slate-600">Idioma preferencial</p>
                        <p className="text-slate-900">{doctor.preferences.language}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600">Tema do painel</p>
                        <p className="text-slate-900">
                          {doctor.preferences.theme === "dark" ? "Escuro" : "Claro"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600">Notificações</p>
                        <p className="text-slate-900">
                          {doctor.preferences.notifications ? "Ativadas" : "Desativadas"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">
                      Configure suas preferências para personalizar a experiência.
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-slate-700">Configurações da agenda</p>
                  <div className="mt-3 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="font-medium text-slate-600">Duração da consulta</p>
                        <p className="text-slate-900">
                          {typeof doctor?.configuracoes?.duracaoConsulta === "number"
                            ? `${doctor.configuracoes.duracaoConsulta} minutos`
                            : "Não configurada"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600">Valor padrão</p>
                        <p className="text-slate-900">
                          {formattedConsultationValue ?? "Não configurado"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600">Atende convênios</p>
                        <p className="text-slate-900">
                          {doctor?.configuracoes?.aceitaConvenio ? "Sim" : "Não"}
                        </p>
                      </div>
                      {doctor?.configuracoes?.aceitaConvenio ? (
                        <div className="sm:col-span-2">
                          <p className="font-medium text-slate-600">Convênios aceitos</p>
                          <p className="text-slate-900">
                            {convenios.length
                              ? convenios.join(", ")
                              : "Nenhum convênio cadastrado"}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <p className="font-medium text-slate-600">Horários de atendimento</p>
                      {scheduleEntries.length ? (
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                          {scheduleEntries.map((entry) => (
                            <li
                              key={entry.id}
                              className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2"
                            >
                              <div className="font-medium text-blue-700">{entry.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {entry.ativo && entry.inicio && entry.fim
                                  ? `${entry.inicio} - ${entry.fim}`
                                  : "Sem atendimento"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-muted-foreground">
                          Configure seus horários para permitir agendamentos automáticos.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
