import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { handleLogout as utilHandleLogout } from "@/utils/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataSourceCard } from "@/components/integrations/DataSourceCard";
import { IntegrationLogs } from "@/components/integrations/IntegrationLogs";
import { useIntegrations } from "@/hooks/useIntegrations";
import { PageHeader } from "@/components/profile/PageHeader";
import { Link2, Shield, Info, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const GerenciarConexoes = () => {
  const { userData, user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  const {
    dataSources,
    consents,
    logs,
    loading,
    actionLoading,
    grantConsent,
    revokeConsent,
    getConsentStatus
  } = useIntegrations();

  useEffect(() => {
    if (authLoading) return;

    if (!user || !userData) {
      navigate("/login");
      return;
    }

    if (userData.userType !== 'paciente') {
      navigate("/login");
      return;
    }

    if (!userData.onboardingCompleted) {
      navigate("/onboarding");
      return;
    }
  }, [user, userData, authLoading, navigate]);

  const handleLogout = () => utilHandleLogout(navigate, logout);

  const handleGoBack = () => {
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <PageHeader
          title="AgendarBrasil"
          subtitle="Gerenciar Conexões"
          onLogout={handleLogout}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <PageHeader
        title="AgendarBrasil"
        subtitle="Gerenciar Conexões"
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Link2 className="h-6 w-6 text-blue-600" />
                Gerenciar Conexões
              </h1>
              <p className="text-muted-foreground">
                Controle quais fontes externas podem enviar dados para sua conta
              </p>
            </div>
          </div>

          {/* LGPD Information */}
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Proteção de Dados:</strong> Em conformidade com a LGPD, você tem controle total 
              sobre suas informações de saúde. Pode autorizar ou revogar o acesso a qualquer momento. 
              Todos os consentimentos são registrados com data, hora e IP para auditoria.
            </AlertDescription>
          </Alert>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              As integrações permitem que laboratórios, clínicas e outros prestadores de saúde 
              enviem automaticamente seus resultados e dados diretamente para sua conta, 
              centralizando seu histórico médico.
            </AlertDescription>
          </Alert>

          {/* Data Sources Grid */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Fontes de Dados Disponíveis
            </h2>
            {dataSources.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma fonte disponível
                  </h3>
                  <p className="text-muted-foreground">
                    Novas integrações serão adicionadas em breve. Você será notificado 
                    quando novos parceiros estiverem disponíveis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataSources.map((source) => (
                  <DataSourceCard
                    key={source.id}
                    dataSource={source}
                    consent={getConsentStatus(source.id)}
                    onGrant={grantConsent}
                    onRevoke={revokeConsent}
                    isLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Integration Logs */}
          <IntegrationLogs logs={logs} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default GerenciarConexoes;