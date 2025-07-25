import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      console.log("Verificando pagamento para consulta:", consultaId);
      
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
      console.error('Erro ao verificar pagamento:', error);
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