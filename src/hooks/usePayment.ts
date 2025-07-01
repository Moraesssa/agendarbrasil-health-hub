
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePayment = () => {
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const processPayment = async (paymentData: {
    consultaId: string;
    medicoId: string;
    valor: number;
    metodo: 'credit_card' | 'pix';
  }) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para realizar o pagamento.",
        variant: "destructive"
      });
      return { success: false };
    }

    setProcessing(true);
    try {
      console.log("Iniciando processamento de pagamento:", paymentData);
      
      // Chamar a Edge Function do Stripe para criar checkout
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          consultaId: paymentData.consultaId,
          medicoId: paymentData.medicoId,
          amount: Math.round(paymentData.valor * 100), // Converter para centavos
          currency: 'brl',
          paymentMethod: paymentData.metodo,
          successUrl: `${window.location.origin}/agenda-paciente?payment=success`,
          cancelUrl: `${window.location.origin}/agenda-paciente?payment=cancelled`
        }
      });

      if (error) {
        console.error("Erro na Edge Function:", error);
        throw new Error(error.message || "Erro ao criar sessão de pagamento");
      }

      if (data?.url) {
        console.log("URL de checkout recebida:", data.url);
        // Redirecionar para o Stripe Checkout
        window.location.href = data.url;
        return { success: true };
      } else {
        throw new Error('URL de checkout não foi retornada');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast({
        title: "Erro no pagamento",
        description: error instanceof Error ? error.message : "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setProcessing(false);
    }
  };

  const createCustomerPortalSession = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para acessar o portal do cliente.",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      console.log("Criando sessão do portal do cliente");
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          returnUrl: `${window.location.origin}/financeiro`
        }
      });

      if (error) {
        console.error("Erro na Edge Function:", error);
        
        // Mensagens de erro mais específicas
        let errorMessage = "Erro ao criar portal do cliente";
        if (error.message?.includes("não configurado")) {
          errorMessage = "Sistema de pagamento não configurado. Entre em contato com o suporte.";
        } else if (error.message?.includes("não autenticado")) {
          errorMessage = "Sessão expirada. Faça login novamente.";
        } else if (error.message?.includes("não encontrado")) {
          errorMessage = "Dados do cliente não encontrados. Tente fazer uma compra primeiro.";
        }
        
        throw new Error(errorMessage);
      }

      if (data?.url) {
        console.log("URL do portal recebida:", data.url);
        window.open(data.url, '_blank');
        return { success: true };
      } else {
        throw new Error('URL do portal não foi retornada');
      }
    } catch (error) {
      console.error('Erro ao abrir portal do cliente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível abrir o portal do cliente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return {
    processing,
    processPayment,
    createCustomerPortalSession
  };
};
