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

interface DoctorProfileTabsProps {
  doctor: BaseUser | null;
  loading?: boolean;
}

export const DoctorProfileTabs = ({ doctor, loading }: DoctorProfileTabsProps) => {
  const specialties = doctor?.especialidades?.length ? doctor.especialidades : [];

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
            ) : doctor?.preferences ? (
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium text-slate-600">Idioma preferencial</p>
                  <p className="text-slate-900">{doctor.preferences.language}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-600">Tema do painel</p>
                  <p className="text-slate-900">{doctor.preferences.theme === "dark" ? "Escuro" : "Claro"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-600">Notificações</p>
                  <p className="text-slate-900">
                    {doctor.preferences.notifications ? "Ativadas" : "Desativadas"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure suas preferências para personalizar a experiência.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
