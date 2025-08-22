import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { advancedLogger } from '@/utils/advancedLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Bug, Info, AlertCircle, RefreshCw, Search, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdvancedLoggingSetup from '@/components/AdvancedLoggingSetup';

interface LogEntry {
  id: string;
  trace_id: string;
  level: string;
  message: string;
  timestamp: string;
  url: string;
  context?: string;
  meta?: any;
  stack_trace?: string;
  user_id?: string;
}

const Debug: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    traceId: '',
    level: '',
    limit: 100
  });
  const [isAdvancedEnabled, setIsAdvancedEnabled] = useState(false);

  useEffect(() => {
    const checkLoggingStatus = async () => {
      const enabled = await advancedLogger.isAdvancedLoggingEnabled();
      setIsAdvancedEnabled(enabled);
      if (enabled) {
        loadLogs();
      }
    };
    
    checkLoggingStatus();
  }, []);

  const loadLogs = async () => {
    const enabled = await advancedLogger.isAdvancedLoggingEnabled();
    if (!enabled) return;
    
    setLoading(true);
    try {
      const result = await advancedLogger.queryLogs(filters);
      if (result?.logs) {
        setLogs(result.logs);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar logs',
        description: 'Não foi possível carregar os logs avançados.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testErrorCapture = () => {
    // Test different types of errors
    console.error('Test error from debug page');
    
    try {
      throw new Error('Test exception from debug page');
    } catch (error) {
      advancedLogger.captureException(error as Error, { testType: 'manual' });
    }
    
    // Test network error
    fetch('/nonexistent-endpoint').catch(() => {});
    
    toast({
      title: 'Testes executados',
      description: 'Erros de teste foram gerados. Verifique os logs.'
    });
  };

  const generateTestLogs = () => {
    console.log('Test log message', { data: 'test' });
    console.warn('Test warning message');
    console.info('Test info message with complex data', { 
      nested: { object: true },
      array: [1, 2, 3],
      timestamp: Date.now()
    });
    
    advancedLogger.captureBreadcrumb('User clicked generate test logs', { 
      page: 'debug',
      action: 'generate_test_logs'
    });
    
    toast({
      title: 'Logs de teste gerados',
      description: 'Mensagens de teste foram enviadas para o sistema de logging.'
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bug className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      case 'info':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você precisa estar logado para acessar o painel de debug.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Avançado</h1>
          <p className="text-muted-foreground">
            Sistema de monitoramento e logging em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Trace ID: {advancedLogger.getTraceId().slice(-8)}
          </Badge>
          <Button onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Configuração</TabsTrigger>
          <TabsTrigger value="logs" disabled={!isAdvancedEnabled}>Logs em Tempo Real</TabsTrigger>
          <TabsTrigger value="testing" disabled={!isAdvancedEnabled}>Ferramentas de Teste</TabsTrigger>
          <TabsTrigger value="system" disabled={!isAdvancedEnabled}>Informações do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <AdvancedLoggingSetup />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Trace ID</label>
                  <Input
                    placeholder="UUID do trace..."
                    value={filters.traceId}
                    onChange={(e) => setFilters(prev => ({ ...prev, traceId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nível</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={filters.level}
                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Limite</label>
                  <Input
                    type="number"
                    value={filters.limit}
                    onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 100 }))}
                    min="10"
                    max="1000"
                  />
                </div>
              </div>
              <Button onClick={loadLogs} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Filtrar Logs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs Capturados ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Carregando logs...</p>
                </div>
              ) : logs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <Badge variant={getLevelColor(log.level) as any}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {log.trace_id.slice(-8)}
                        </Badge>
                      </div>
                      
                      <div className="font-medium mb-1">{log.message}</div>
                      
                      {log.context && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Contexto: {log.context}
                        </div>
                      )}
                      
                      {log.url && (
                        <div className="text-xs text-muted-foreground mb-1">
                          URL: {log.url}
                        </div>
                      )}
                      
                      {log.stack_trace && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground">
                            Stack Trace
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {log.stack_trace}
                          </pre>
                        </details>
                      )}
                      
                      {log.meta && Object.keys(log.meta).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground">
                            Metadados
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado. Use as ferramentas de teste para gerar logs.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas de Teste</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use estas ferramentas para testar o sistema de logging.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={generateTestLogs} variant="outline">
                  <Bug className="w-4 h-4 mr-2" />
                  Gerar Logs de Teste
                </Button>
                
                <Button onClick={testErrorCapture} variant="destructive">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Testar Captura de Erros
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• <strong>Gerar Logs de Teste:</strong> Cria diferentes tipos de mensagens de log</p>
                <p>• <strong>Testar Captura de Erros:</strong> Simula erros JavaScript e de rede</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Sessão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {user?.id}</div>
                <div><strong>Email:</strong> {user?.email}</div>
                <div><strong>Session ID:</strong> {advancedLogger.getTraceId()}</div>
                <div><strong>Logging Ativo:</strong> {isAdvancedEnabled ? 'Sim' : 'Não'}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Informações do Navegador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                <div><strong>Idioma:</strong> {navigator.language}</div>
                <div><strong>Online:</strong> {navigator.onLine ? 'Sim' : 'Não'}</div>
                <div><strong>URL Atual:</strong> {window.location.href}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Debug;