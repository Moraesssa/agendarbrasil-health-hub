
import { useEffect, useRef } from "react";
import { usePayment } from "@/hooks/usePayment";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

interface PaymentStatusCheckerProps {
  consultaId?: string;
  onSuccess?: () => void;
}

export const PaymentStatusChecker = ({ consultaId, onSuccess }: PaymentStatusCheckerProps) => {
  const { verifyPayment, checkPendingPayments } = usePayment();
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
    
  logger.debug('PaymentStatusChecker: Verificando parâmetros da URL', 'PaymentStatusChecker', {
      sessionId: sessionId ? 'presente' : 'ausente',
      success,
      payment,
      consultaId
    });
    // Se não há parâmetros relevantes na URL, marcar como verificado para
    // evitar re-execuções contínuas (que podem ocorrer se as funções em
    // usePayment mudarem de identidade entre renders).
    if (!sessionId && !payment) {
      // Marcar como verificado para evitar re-execuções desnecessárias
      hasChecked.current = true;
      logger.debug('PaymentStatusChecker: Sem parâmetros de pagamento na URL — abortando checagem automática', 'PaymentStatusChecker');
      return;
    }
    
    if ((sessionId && success === 'true') || payment === 'success') {
      hasChecked.current = true;
  logger.info('PaymentStatusChecker: Detectado retorno do Stripe, verificando pagamentos...', 'PaymentStatusChecker');
      
      toast({
        title: "Verificando pagamento...",
        description: "Aguarde enquanto confirmamos seu pagamento.",
      });
      
      const checkPayments = async () => {
        try {
          // Se temos consultaId específica, verificar apenas ela
          if (consultaId) {
            logger.debug('PaymentStatusChecker: Verificando consulta específica:', 'PaymentStatusChecker', { consultaId });
            const result = await verifyPayment(consultaId);
            logger.debug('PaymentStatusChecker: Resultado da verificação:', 'PaymentStatusChecker', result);
            
            if (result && result.paid) {
              toast({
                title: "Pagamento confirmado!",
                description: "Sua consulta foi atualizada com sucesso.",
              });
              
              // Disparar evento para atualizar interfaces
              window.dispatchEvent(new CustomEvent('consultaUpdated'));
            }
          } else {
            // Verificar todas as consultas pendentes (uma vez)
            logger.debug('PaymentStatusChecker: Verificando todas as consultas pendentes...', 'PaymentStatusChecker');
            await checkPendingPayments();
          }
          
          // Limpar parâmetros da URL ANTES de chamar onSuccess
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          // Aguardar um pouco antes de chamar onSuccess
          setTimeout(() => {
            onSuccess?.();
          }, 2000); // Aumentar o tempo para garantir que a atualização seja processada
          
        } catch (error) {
          logger.error('PaymentStatusChecker: Erro ao verificar pagamento:', 'PaymentStatusChecker', error);
          toast({
            title: "Erro na verificação",
            description: "Não foi possível verificar o pagamento automaticamente. Tente o botão 'Verificar Pagamento'.",
            variant: "destructive",
          });
        }
      };

      checkPayments();
    }
  }, [consultaId, verifyPayment, checkPendingPayments, onSuccess, toast]);

  // Event-driven: ouvir por evento 'consultaUpdated' para re-checar pagamentos quando necessário.
  useEffect(() => {
    const handler = () => {
      // Só re-checar se ainda não marcamos hasChecked
      if (hasChecked.current) return;
      hasChecked.current = true;
      logger.debug('PaymentStatusChecker: Evento consultaUpdated recebido — acionando checkPendingPayments', 'PaymentStatusChecker');
      checkPendingPayments();
    };

    window.addEventListener('consultaUpdated', handler as EventListener);

    // Expor um evento para permitir verificação manual por other UI
    const manualHandler = () => {
      logger.debug('PaymentStatusChecker: Evento manual checkPaymentRequested recebido', 'PaymentStatusChecker');
      checkPendingPayments();
    };
    window.addEventListener('checkPaymentRequested', manualHandler as EventListener);

    return () => {
      window.removeEventListener('consultaUpdated', handler as EventListener);
      window.removeEventListener('checkPaymentRequested', manualHandler as EventListener);
    };
  }, [checkPendingPayments]);

  return null; // Componente invisível
};
