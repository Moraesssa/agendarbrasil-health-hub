import { useEffect } from "react";
import { usePayment } from "@/hooks/usePayment";
import { useToast } from "@/hooks/use-toast";

interface PaymentStatusCheckerProps {
  consultaId?: string;
  onSuccess?: () => void;
}

export const PaymentStatusChecker = ({ consultaId, onSuccess }: PaymentStatusCheckerProps) => {
  const { verifyPayment } = usePayment();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há parâmetros de retorno do Stripe na URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const payment = urlParams.get('payment');
    
    if ((sessionId && success === 'true') || payment === 'success') {
      console.log('Detectado retorno do Stripe, verificando pagamentos...');
      
      const checkPayments = async () => {
        try {
          // Se temos consultaId específica, verificar apenas ela
          if (consultaId) {
            await verifyPayment(consultaId);
          } else {
            // Verificar todas as consultas pendentes recentes
            console.log('Verificando pagamentos pendentes...');
            toast({
              title: "Verificando pagamento...",
              description: "Aguarde enquanto confirmamos seu pagamento.",
            });
          }
          
          onSuccess?.();
          
          // Limpar parâmetros da URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error('Erro ao verificar pagamento:', error);
          toast({
            title: "Erro na verificação",
            description: "Não foi possível verificar o pagamento automaticamente.",
            variant: "destructive",
          });
        }
      };

      checkPayments();
    }
  }, [consultaId, verifyPayment, onSuccess, toast]);

  return null; // Componente invisível
};