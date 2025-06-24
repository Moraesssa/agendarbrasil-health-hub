
import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export const PageLoader = ({ message = "Carregando..." }: PageLoaderProps) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-blue-200 opacity-25"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">{message}</p>
          <p className="text-sm text-gray-500 mt-1">Aguarde um momento...</p>
        </div>
      </div>
    </div>
  );
};

// Componente específico para erros de carregamento de páginas
export const PageLoadError = ({ 
  onRetry, 
  error 
}: { 
  onRetry?: () => void;
  error?: Error;
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Erro ao carregar página
        </h2>
        <p className="text-gray-600 mb-4">
          Não foi possível carregar esta página. Verifique sua conexão com a internet.
        </p>
        {import.meta.env.DEV && error && (
          <div className="text-left bg-red-50 p-3 rounded border text-sm mb-4">
            <strong>Erro:</strong> {error.message}
          </div>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
};
