import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ExternalDataSource, UserConsent, DATA_TYPE_LABELS } from '@/types/integrations';
import { ConsentModal } from './ConsentModal';
import { Link2, Unlink, Shield, Database, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface DataSourceCardProps {
  dataSource: ExternalDataSource;
  consent: UserConsent | null;
  onGrant: (sourceId: string) => Promise<boolean>;
  onRevoke: (sourceId: string) => Promise<boolean>;
  isLoading: string | null;
}

export const DataSourceCard = ({ 
  dataSource, 
  consent, 
  onGrant, 
  onRevoke, 
  isLoading 
}: DataSourceCardProps) => {
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  const hasActiveConsent = consent?.status === 'granted';
  const isActionLoading = isLoading === dataSource.id;

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      setShowConsentModal(true);
    } else {
      // This will be handled by the AlertDialog
    }
  };

  const handleGrantConsent = async () => {
    return await onGrant(dataSource.id);
  };

  const handleRevokeConsent = async () => {
    return await onRevoke(dataSource.id);
  };

  const getStatusBadge = () => {
    if (hasActiveConsent) {
      return (
        <Badge className="gap-1 bg-green-100 text-green-800 border-green-200">
          <Link2 className="h-3 w-3" />
          Conectado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Unlink className="h-3 w-3" />
        Desconectado
      </Badge>
    );
  };

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-blue-600" />
                {dataSource.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {dataSource.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              <Switch
                checked={hasActiveConsent}
                onCheckedChange={handleToggle}
                disabled={isActionLoading}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Data types */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Tipos de dados disponíveis:
            </h4>
            <div className="flex flex-wrap gap-1">
              {dataSource.data_types.map((type, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {DATA_TYPE_LABELS[type as keyof typeof DATA_TYPE_LABELS] || type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Consent info */}
          {hasActiveConsent && consent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Consentimento ativo
                </span>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Autorizado em: {format(new Date(consent.granted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div>Versão do termo: {consent.consent_version}</div>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-end">
            {hasActiveConsent ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isActionLoading}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  >
                    {isActionLoading ? 'Processando...' : 'Revogar Acesso'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revogar consentimento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza de que deseja revogar o acesso do "{dataSource.name}" aos seus dados? 
                      Novos dados não serão mais recebidos automaticamente, mas os dados já importados 
                      permanecerão em sua conta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRevokeConsent}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sim, revogar acesso
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                size="sm"
                onClick={() => setShowConsentModal(true)}
                disabled={isActionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isActionLoading ? 'Processando...' : 'Autorizar Integração'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consent Modal */}
      <ConsentModal
        open={showConsentModal}
        onOpenChange={setShowConsentModal}
        dataSource={dataSource}
        onConfirm={handleGrantConsent}
        isLoading={isActionLoading}
      />
    </>
  );
};