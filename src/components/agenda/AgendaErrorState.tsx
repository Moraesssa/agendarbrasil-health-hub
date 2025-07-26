
import { AlertTriangle, UserX, Stethoscope, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface AgendaError {
  type: 'auth' | 'user-type' | 'medico-data' | 'locations' | 'general';
  message: string;
  details?: string;
}

interface AgendaErrorStateProps {
  error: AgendaError;
  onRetry: () => void;
}

export const AgendaErrorState = ({ error, onRetry }: AgendaErrorStateProps) => {
  const navigate = useNavigate();

  const getErrorIcon = () => {
    switch (error.type) {
      case 'auth': return <UserX className="w-8 h-8 text-red-500" />;
      case 'user-type': return <Stethoscope className="w-8 h-8 text-orange-500" />;
      case 'medico-data': return <Stethoscope className="w-8 h-8 text-blue-500" />;
      case 'locations': return <MapPin className="w-8 h-8 text-yellow-500" />;
      default: return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  };

  const getActions = () => {
    switch (error.type) {
      case 'auth':
        return (
          <Button onClick={() => navigate('/login')} className="mt-4">
            Fazer Login
          </Button>
        );
      case 'user-type':
        return (
          <Button onClick={() => navigate('/')} className="mt-4">
            Ir para Início
          </Button>
        );
      case 'medico-data':
        return (
          <div className="flex gap-2 mt-4">
            <Button onClick={() => navigate('/onboarding')} className="flex-1">
              Completar Cadastro
            </Button>
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        );
      case 'locations':
        return (
          <div className="flex gap-2 mt-4">
            <Button onClick={() => navigate('/gerenciar-locais')} className="flex-1">
              Gerenciar Locais
            </Button>
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        );
      default:
        return (
          <Button variant="outline" onClick={onRetry} className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-lg">{error.message}</CardTitle>
          {error.details && (
            <CardDescription>{error.details}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {getActions()}
        </CardContent>
      </Card>
    </div>
  );
};
