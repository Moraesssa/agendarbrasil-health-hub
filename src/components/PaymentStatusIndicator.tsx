import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CreditCard, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

interface PaymentStatusIndicatorProps {
  consultaId: string;
  statusPagamento: string;
  onStatusUpdate?: () => void;
  showVerifyButton?: boolean;
}

export const PaymentStatusIndicator = ({ 
  consultaId, 
  statusPagamento, 
  onStatusUpdate,
  showVerifyButton = true 
}: PaymentStatusIndicatorProps) => {
  const [verifying, setVerifying] = useState(false);
  const { verifyPayment } = usePayment();
  const { toast } = useToast();

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      logger.debug('PaymentStatusIndicator: Verificando pagamento para consulta', 'PaymentStatusIndicator', { consultaId });
      
      const result = await verifyPayment(consultaId);
      
      if (result.success && result.paid) {
        toast({
          title: "Pagamento confirmado!",
          description: "Sua consulta foi atualizada com sucesso.",
        });
        onStatusUpdate?.();
      } else if (result.success && !result.paid) {
        toast({
          title: "Pagamento pendente",
          description: "O pagamento ainda não foi confirmado. Tente novamente em alguns minutos.",
          variant: "default"
        });
      } else {
        toast({
          title: "Erro na verificação",
          description: "Não foi possível verificar o pagamento.",
          variant: "destructive"
        });
      }
    } catch (error) {
      logger.error('PaymentStatusIndicator: Erro ao verificar pagamento', 'PaymentStatusIndicator', error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pago':
        return {
          variant: 'outline' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Pago',
          color: 'text-success bg-success/10 border-success/20'
        };
      case 'pendente':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'Pendente',
          color: 'text-yellow-600'
        };
      case 'pending_payment':
        return {
          variant: 'outline' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Aguardando Pagamento',
          color: 'text-orange-600'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: <CreditCard className="h-3 w-3" />,
          text: status,
          color: 'text-muted-foreground'
        };
    }
  };

  const statusConfig = getStatusConfig(statusPagamento);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusConfig.variant} className={`flex items-center gap-1 ${statusConfig.color}`}>
        {statusConfig.icon}
        {statusConfig.text}
      </Badge>
      
      {showVerifyButton && statusPagamento !== 'pago' && (
        <Button
          onClick={handleVerifyPayment}
          disabled={verifying}
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${verifying ? 'animate-spin' : ''}`} />
          {verifying ? "Verificando..." : "Verificar"}
        </Button>
      )}
    </div>
  );
};