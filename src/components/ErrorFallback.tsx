
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export const ErrorFallback = ({ 
  error, 
  onRetry, 
  title = "Algo deu errado",
  description = "Ocorreu um erro inesperado. Tente novamente."
}: ErrorFallbackProps) => {
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-red-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">{description}</p>
        
        {import.meta.env.DEV && error && (
          <details className="text-left bg-red-50 p-3 rounded border text-sm">
            <summary className="cursor-pointer font-medium text-red-800 mb-2">
              Detalhes do erro (desenvolvimento)
            </summary>
            <div className="space-y-2">
              <div><strong>Erro:</strong> {error.message}</div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {onRetry && (
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
