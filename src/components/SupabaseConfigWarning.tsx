import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SupabaseConfigWarningProps {
  show: boolean;
}

export const SupabaseConfigWarning: React.FC<SupabaseConfigWarningProps> = ({ show }) => {
  if (!show) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Configuração do Banco de Dados Necessária</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          O sistema não consegue se conectar ao banco de dados. Para usar a funcionalidade de agendamento, você precisa:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Configurar as variáveis de ambiente do Supabase no arquivo <code>.env</code></li>
          <li>Definir <code>VITE_SUPABASE_URL</code> com a URL do seu projeto</li>
          <li>Definir <code>VITE_SUPABASE_ANON_KEY</code> com a chave pública do projeto</li>
          <li>Reiniciar o servidor de desenvolvimento</li>
        </ol>
        <p className="mt-2 text-sm">
          Consulte o arquivo <code>.env.example</code> para ver o formato correto.
        </p>
      </AlertDescription>
    </Alert>
  );
};