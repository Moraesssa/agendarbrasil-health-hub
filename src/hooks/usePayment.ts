import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessPaymentInput {
  consultaId: string;
  medicoId: string;
  valor: number; // em reais
  metodo: 'credit_card' | 'pix';
}

interface ProcessPaymentResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Hook para processamento de pagamentos via Stripe Checkout.
 * Integra-se à edge function `create-stripe-checkout`.
 */
export const usePayment = () => {
  const [processing, setProcessing] = useState(false);

  const processPayment = useCallback(
    async (input: ProcessPaymentInput): Promise<ProcessPaymentResult> => {
      setProcessing(true);
      try {
        const { consultaId, medicoId, valor, metodo } = input;

        // Conversão para centavos (Stripe trabalha em menor unidade)
        const amount = Math.round(valor * 100);

        const successUrl = `${window.location.origin}/agenda-paciente?payment=success&consulta=${consultaId}`;
        const cancelUrl = `${window.location.origin}/agenda-paciente?payment=cancelled`;

        const { data, error } = await supabase.functions.invoke(
          'create-stripe-checkout',
          {
            body: {
              consultaId,
              medicoId,
              amount,
              currency: 'brl',
              paymentMethod: metodo === 'pix' ? 'pix' : 'card',
              successUrl,
              cancelUrl,
            },
          }
        );

        if (error) throw error;
        if (!data?.url) throw new Error('URL de checkout não recebida');

        // Abre Stripe em nova aba
        window.open(data.url, '_blank', 'noopener,noreferrer');

        toast.success('Redirecionando para o Stripe...', {
          description: 'Conclua o pagamento na nova aba.',
        });

        return { success: true, url: data.url };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido no pagamento';
        console.error('[usePayment] Erro:', message);
        toast.error('Falha ao iniciar pagamento', { description: message });
        return { success: false, error: message };
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId },
      });
      if (error) throw error;
      return {
        verified: !!data?.verified,
        success: !!data?.success,
        paid: data?.status === 'paid',
        ...data,
      };
    } catch (err) {
      console.error('[usePayment] verifyPayment erro:', err);
      return { verified: false, success: false, paid: false };
    }
  }, []);

  const checkPendingPayments = useCallback(async (_userId?: string) => {
    // Reservado para futura integração; mantém contrato legado
    return [];
  }, []);

  const createCustomerPortalSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      return { url: data?.url ?? '' };
    } catch (err) {
      console.error('[usePayment] customer-portal erro:', err);
      toast.error('Não foi possível abrir o portal');
      return { url: '' };
    }
  }, []);

  return {
    processing,
    processPayment,
    verifyPayment,
    checkPendingPayments,
    createCustomerPortalSession,
  };
};
