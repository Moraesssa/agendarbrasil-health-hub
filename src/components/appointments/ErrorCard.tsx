
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  onRetry: () => void;
}

const ErrorCard = ({ onRetry }: ErrorCardProps) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertCircle className="h-8 w-8 text-red-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      Não foi possível carregar suas consultas
    </h3>
    <p className="text-gray-600 mb-4">
      Verifique sua conexão com a internet e tente novamente.
    </p>
    <Button 
      onClick={onRetry}
      className="bg-blue-500 hover:bg-blue-600"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Tentar Novamente
    </Button>
  </div>
);

export default ErrorCard;
