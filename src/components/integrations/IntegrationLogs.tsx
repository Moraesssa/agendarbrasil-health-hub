import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IntegrationLog } from '@/types/integrations';
import { History, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface IntegrationLogsProps {
  logs: IntegrationLog[];
  loading: boolean;
}

export const IntegrationLogs = ({ logs, loading }: IntegrationLogsProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'data_received': 'Dados recebidos',
      'consent_granted': 'Consentimento concedido',
      'consent_revoked': 'Consentimento revogado',
      'authentication': 'Autenticação',
      'error': 'Erro'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <History className="h-5 w-5" />
            Histórico de Integrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <History className="h-5 w-5 text-blue-600" />
          Histórico de Integrações
          {logs.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {logs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <History className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <p className="text-muted-foreground mb-2">Nenhuma atividade registrada</p>
              <p className="text-sm text-muted-foreground/80">
                As atividades de integração aparecerão aqui quando dados forem sincronizados
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(log.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">
                        {getActionLabel(log.action)}
                      </p>
                      <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? 'Sucesso' : 
                         log.status === 'failed' ? 'Falhou' : 
                         log.status === 'rejected' ? 'Rejeitado' : log.status}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    
                    {log.error_message && (
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {log.error_message}
                      </p>
                    )}
                    
                    {log.payload && log.action === 'data_received' && log.status === 'success' && (
                      <p className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                        Dados recebidos: {log.payload.test_name || 'Dados de saúde'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};