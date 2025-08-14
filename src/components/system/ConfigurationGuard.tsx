import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { getSupabaseConfig, checkSupabaseConnection } from '@/utils/supabaseCheck';

interface ConfigurationGuardProps {
  children: React.ReactNode;
}

export const ConfigurationGuard: React.FC<ConfigurationGuardProps> = ({ children }) => {
  const [configStatus, setConfigStatus] = useState<{
    isConfigured: boolean;
    isConnected: boolean;
    error?: string;
    isChecking: boolean;
  }>({
    isConfigured: false,
    isConnected: false,
    isChecking: true
  });

  const checkConfiguration = async () => {
    setConfigStatus(prev => ({ ...prev, isChecking: true }));
    
    const config = getSupabaseConfig();
    
    if (!config.isConfigured) {
      setConfigStatus({
        isConfigured: false,
        isConnected: false,
        error: "Variáveis de ambiente do Supabase não configuradas",
        isChecking: false
      });
      return;
    }

    const connectionResult = await checkSupabaseConnection();
    
    setConfigStatus({
      isConfigured: true,
      isConnected: connectionResult.connected,
      error: connectionResult.error,
      isChecking: false
    });
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  // Se ainda está verificando, mostrar loading
  if (configStatus.isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Verificando configuração do sistema...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não está configurado ou não conectado, mostrar erro
  if (!configStatus.isConfigured || !configStatus.isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Erro de Configuração do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sistema Não Configurado</AlertTitle>
              <AlertDescription>
                {!configStatus.isConfigured 
                  ? "As variáveis de ambiente do Supabase não estão configuradas corretamente."
                  : `Não foi possível conectar ao banco de dados: ${configStatus.error}`
                }
              </AlertDescription>
            </Alert>

            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Configuração Necessária
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Para usar o AgendarBrasil Health Hub, configure as seguintes variáveis de ambiente:
              </p>
              <div className="bg-white p-3 rounded border font-mono text-sm">
                <div>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=sua-chave-anonima</div>
                <div>SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={checkConfiguration}
                disabled={configStatus.isChecking}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${configStatus.isChecking ? 'animate-spin' : ''}`} />
                <span>Verificar Novamente</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p>
                <strong>Para desenvolvedores:</strong> Execute <code>npm run setup</code> para 
                configurar o ambiente automaticamente, ou consulte o arquivo <code>SETUP.md</code> 
                para instruções detalhadas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tudo está configurado corretamente, renderizar a aplicação
  return <>{children}</>;
};