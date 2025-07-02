
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
        
        // ESTRATÉGIA CORRIGIDA: Tentar abrir em nova aba com verificação mais robusta
        try {
          console.log("Tentando abrir Stripe em nova aba...");
          const newWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
          
          // Aguardar um pouco antes de verificar se foi bloqueado
          setTimeout(() => {
            if (!newWindow || newWindow.closed) {
              console.log("Pop-up foi bloqueado - mostrando opção manual");
              toast({
                title: "Pop-up bloqueado",
                description: "Clique no botão abaixo para abrir o pagamento",
                variant: "default",
                action: (
                  <button 
                    onClick={() => window.location.href = data.url}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Abrir Pagamento
                  </button>
                )
              });
            } else {
              console.log("Nova aba aberta com sucesso");
              
              // Monitorar fechamento da aba
              const checkClosed = setInterval(() => {
                if (newWindow.closed) {
                  console.log("Aba do Stripe foi fechada");
                  clearInterval(checkClosed);
                }
              }, 1000);
              
              // Limpar interval após 5 minutos
              setTimeout(() => clearInterval(checkClosed), 300000);
            }
          }, 500); // Aguardar 500ms antes de verificar
          
        } catch (popupError) {
          console.error("Erro ao abrir popup:", popupError);
          toast({
            title: "Erro ao abrir pagamento",
            description: "Clique no botão abaixo para continuar",
            variant: "default",
            action: (
              <button 
                onClick={() => window.location.href = data.url}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Abrir Pagamento
              </button>
            )
          });
        }
        
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
