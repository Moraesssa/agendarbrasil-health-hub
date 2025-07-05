
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingFallbackProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const LoadingFallback = ({ 
  message = "Carregando...", 
  onRetry,
  showRetry = false 
}: LoadingFallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-gray-600">{message}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};
