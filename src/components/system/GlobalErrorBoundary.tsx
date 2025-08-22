import React, { Component, ErrorInfo, ReactNode } from 'react';
import { advancedLogger } from '@/utils/advancedLogger';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to your error reporting service
    console.error("Uncaught error captured by GlobalErrorBoundary:", error, errorInfo);
    advancedLogger.captureException(error, {
      componentStack: errorInfo.componentStack,
      source: 'GlobalErrorBoundary'
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
          <div className="max-w-lg p-8 border rounded-lg shadow-lg bg-card">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-destructive mb-2">
              Ocorreu um erro inesperado.
            </h1>
            <p className="mb-6 text-muted-foreground">
              Nossa equipe de desenvolvimento já foi notificada. Por favor, tente recarregar a página. Se o problema persistir, entre em contato com o suporte.
            </p>
            <Button onClick={this.handleReload} size="lg">
              Recarregar Página
            </Button>
            {this.state.error && (
              <details className="mt-6 text-left bg-muted p-3 rounded-lg text-xs">
                <summary className="cursor-pointer text-sm font-medium">
                  Detalhes Técnicos do Erro
                </summary>
                <pre className="mt-2 font-mono whitespace-pre-wrap break-words">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
