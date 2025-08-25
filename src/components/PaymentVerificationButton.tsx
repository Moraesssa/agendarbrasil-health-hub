import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isValidUUID, logUUIDError } from "@/utils/uuidValidation";
import { logger } from '@/utils/logger';

interface PaymentVerificationButtonProps {
  consultaId: string;
  onSuccess?: () => void;
}

export const PaymentVerificationButton = ({ consultaId, onSuccess }: PaymentVerificationButtonProps) => {
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      // Validação crítica do UUID
      if (!isValidUUID(consultaId)) {
        logUUIDError('PaymentVerificationButton', consultaId);
        toast({
          title: "Erro de validação",
          description: "ID da consulta inválido. Recarregue a página e tente novamente.",
          variant: "destructive",
        });
        return;
      }

  logger.debug('Verificando pagamento para consulta', 'PaymentVerificationButton', { consultaId });
      
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { consulta_id: consultaId }
      });

      if (error) throw error;

      if (data.success && data.payment_status === 'paid') {
        toast({
          title: "Pagamento confirmado!",
          description: "Sua consulta foi atualizada com sucesso.",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Pagamento não confirmado",
          description: "O pagamento ainda não foi processado ou houve um erro.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('Erro ao verificar pagamento', 'PaymentVerificationButton', error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Button
      onClick={handleVerifyPayment}
      disabled={verifying}
      size="sm"
      variant="outline"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
      {verifying ? "Verificando..." : "Verificar Pagamento"}
    </Button>
  );
};