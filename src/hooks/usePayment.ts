
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
        
        // Tentar abrir em nova aba com detecção melhorada de popup bloqueado
        try {
          console.log("Tentando abrir Stripe em nova aba...");
          const newWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
          
          // Aguardar antes de verificar se foi bloqueado
          setTimeout(() => {
            let popupBlocked = false;
            
            try {
              // Verificar se a janela foi bloqueada
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                popupBlocked = true;
              } else {
                // Tentar acessar a location para verificar se foi bloqueada
                try {
                  newWindow.focus();
                } catch (e) {
                  popupBlocked = true;
                }
              }
            } catch (e) {
              popupBlocked = true;
            }
            
            if (popupBlocked) {
              console.log("Pop-up foi bloqueado - oferecendo alternativa manual");
              toast({
                title: "Pop-up bloqueado",
                description: "Seu navegador bloqueou a abertura da nova aba. Clique em 'Abrir Pagamento' para continuar.",
                variant: "default",
                duration: 10000,
              });
              
              // Criar um botão na página para abrir manualmente
              const openPaymentButton = document.createElement('button');
              openPaymentButton.innerText = 'Abrir Pagamento';
              openPaymentButton.className = 'fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700';
              openPaymentButton.onclick = () => {
                window.location.href = data.url;
              };
              document.body.appendChild(openPaymentButton);
              
              // Remover o botão após 30 segundos
              setTimeout(() => {
                if (document.body.contains(openPaymentButton)) {
                  document.body.removeChild(openPaymentButton);
                }
              }, 30000);
            } else {
              console.log("Nova aba aberta com sucesso - redirecionando página original");
              
              // Monitorar fechamento da aba
              const checkClosed = setInterval(() => {
                if (newWindow.closed) {
                  console.log("Aba do Stripe foi fechada");
                  clearInterval(checkClosed);
                }
              }, 1000);
              
              // Limpar interval após 5 minutos
              setTimeout(() => clearInterval(checkClosed), 300000);
              
              // Redirecionar página original para agenda do paciente
              setTimeout(() => {
                window.location.href = "/agenda-paciente";
              }, 1500);
            }
          }, 1000); // Aguardar 1 segundo para verificação mais confiável
          
        } catch (popupError) {
          console.error("Erro ao abrir popup:", popupError);
          toast({
            title: "Erro ao abrir pagamento",
            description: "Não foi possível abrir a nova aba. Redirecionando na mesma página...",
            variant: "default",
            duration: 3000,
          });
          
          // Aguardar 3 segundos antes de redirecionar na mesma aba
          setTimeout(() => {
            window.location.href = data.url;
          }, 3000);
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

  const verifyPayment = async (consultaId: string) => {
    try {
      console.log("Verificando pagamento para consulta:", consultaId);
      
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { consulta_id: consultaId }
      });

      if (error) throw error;

      if (data.success && data.payment_status === 'paid') {
        toast({
          title: "Pagamento confirmado!",
          description: "Sua consulta foi agendada com sucesso.",
        });
        
        // Retornar sucesso sem recarregar página - deixar para o componente que chama decidir
        return { success: true, paid: true };
      }
      
      return { success: true, paid: false };
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      throw error;
    }
  };

  return {
    processing,
    processPayment,
    createCustomerPortalSession,
    verifyPayment
  };
};
