import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { advancedLogger } from '@/utils/advancedLogger';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
// CORREÇÃO: Importando com chaves {}
import { PageLoader } from '@/components/PageLoader'; 
import { AuthDebugInfo } from '@/components/AuthDebugInfo';

// Definição de um tipo simples para o estado dos diagnósticos
type DiagnosticsState = {
  isEnabled: boolean | null;
  logQueueSize: number | null;
  lastSent: string | null;
  traceId: string | null;
  error?: string;
};

const DebugPage = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const checkLoggingStatus = async () => {
    setIsLoading(true);
    setDiagnostics(null);
    logger.debug('Debug: Checking logging status...');
    try {
      const isEnabled = await advancedLogger.isAdvancedLoggingEnabled();
      const traceId = advancedLogger.getTraceId();

      setDiagnostics({
        isEnabled,
        logQueueSize: (advancedLogger as any).queue?.length ?? 0,
        lastSent: 'Not tracked in this version',
        traceId,
      });
    } catch (error: any) {
      logger.error('Failed to get system diagnostics', 'DebugPage', { error });
      setDiagnostics({
        isEnabled: null,
        logQueueSize: null,
        lastSent: null,
        traceId: null,
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendTestLogs = () => {
    setIsSending(true);
    logger.info('Este é um log de teste de INFORMAÇÃO da página de depuração.');
    logger.warn('Este é um log de teste de AVISO.');
    console.log('Este é um console.log de teste que será mapeado para "info".');
    try {
      throw new Error('Este é um erro de teste para o Advanced Logger.');
    } catch (error) {
      advancedLogger.captureException(error as Error, { customContext: 'From Debug Page' });
    }
    setTimeout(() => setIsSending(false), 1000);
  };

  const handleQueryLogs = async () => {
    setIsQuerying(true);
    setQueryResult(null);
    try {
      const traceId = advancedLogger.getTraceId();
      const results = await advancedLogger.queryLogs({ traceId, limit: 10 });
      setQueryResult(results);
    } catch (error) {
      setQueryResult({ error: 'Failed to query logs' });
    } finally {
      setIsQuerying(false);
    }
  };

  if (!supabase) {
    // PageLoader precisa ser envolvido por um elemento JSX
    return <PageLoader message="Supabase client not available." />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Página de Depuração</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={checkLoggingStatus} disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Verificar Status do Logging'}
            </Button>
            {diagnostics && (
              <div className="mt-4 p-2 border rounded">
                <p>Logging Avançado Ativo: <strong>{diagnostics.isEnabled ? 'Sim' : 'Não'}</strong></p>
                <p>Logs na Fila: <strong>{diagnostics.logQueueSize ?? 'N/A'}</strong></p>
                <p>Trace ID Atual: <strong>{diagnostics.traceId ?? 'N/A'}</strong></p>
                {diagnostics.error && <p className="text-red-500">Erro: {diagnostics.error}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações de Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleSendTestLogs} disabled={isSending}>
              {isSending ? 'Enviando...' : 'Enviar Logs de Teste'}
            </Button>
            <Button onClick={handleQueryLogs} disabled={isQuerying}>
              {isQuerying ? 'Consultando...' : 'Consultar Logs (Trace ID Atual)'}
            </Button>
            {queryResult && (
              <pre className="mt-4 p-2 border rounded bg-gray-100 dark:bg-gray-800 text-xs overflow-auto max-h-48">
                {JSON.stringify(queryResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <AuthDebugInfo />
      </div>
    </div>
  );
};

export default DebugPage;