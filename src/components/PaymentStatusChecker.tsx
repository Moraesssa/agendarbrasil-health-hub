import { useEffect, useRef } from "react";
import { usePayment } from "@/hooks/usePayment";
import { useToast } from "@/hooks/use-toast";

interface PaymentStatusCheckerProps {
  consultaId?: string;
  onSuccess?: () => void;
}

export const PaymentStatusChecker = ({ consultaId, onSuccess }: PaymentStatusCheckerProps) => {
  const { verifyPayment } = usePayment();
  const { toast } = useToast();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Evitar múltiplas execuções
    if (hasChecked.current) return;
    
    // Verificar se há parâmetros de retorno do Stripe na URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const payment = urlParams.get('payment');
    
    console.log('PaymentStatusChecker: Verificando parâmetros da URL', {
      sessionId: sessionId ? 'presente' : 'ausente',
      success,
      payment,
      consultaId
    });
    
    if ((sessionId && success === 'true') || payment === 'success') {
      hasChecked.current = true;
      console.log('PaymentStatusChecker: Detectado retorno do Stripe, verificando pagamentos...');
      
      toast({
        title: "Verificando pagamento...",
        description: "Aguarde enquanto confirmamos seu pagamento.",
      });
      
      const checkPayments = async () => {
        try {
          // Se temos consultaId específica, verificar apenas ela
          if (consultaId) {
            console.log('PaymentStatusChecker: Verificando consulta específica:', consultaId);
            const result = await verifyPayment(consultaId);
            console.log('PaymentStatusChecker: Resultado da verificação:', result);
            
            if (result) {
              toast({
                title: "Pagamento confirmado!",
                description: "Sua consulta foi atualizada com sucesso.",
              });
              
              // Disparar evento para atualizar interfaces
              window.dispatchEvent(new CustomEvent('consultaUpdated'));
            }
          } else {
            // Sem consultaId específica, tentar verificar pela sessionId
            console.log('PaymentStatusChecker: Verificando por sessionId...');
            if (sessionId) {
              const response = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
                },
                body: JSON.stringify({ session_id: sessionId })
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  toast({
                    title: "Pagamento confirmado!",
                    description: "Sua consulta foi atualizada com sucesso.",
                  });
                  window.dispatchEvent(new CustomEvent('consultaUpdated'));
                }
              }
            }
          }
          
          // Limpar parâmetros da URL ANTES de chamar onSuccess
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          // Aguardar um pouco antes de chamar onSuccess
          setTimeout(() => {
            onSuccess?.();
          }, 1000); // Aumentar o tempo para garantir que a atualização seja processada
          
        } catch (error) {
          console.error('PaymentStatusChecker: Erro ao verificar pagamento:', error);
          toast({
            title: "Erro na verificação",
            description: "Não foi possível verificar o pagamento automaticamente. Tente o botão 'Verificar Pagamento'.",
            variant: "destructive",
          });
        }
      };

      checkPayments();
    }
  }, [consultaId, verifyPayment, onSuccess, toast]);

  return null; // Componente invisível
};