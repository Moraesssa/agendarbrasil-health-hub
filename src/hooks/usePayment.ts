
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

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
      logger.debug("Iniciando processamento de pagamento:", 'usePayment.processPayment', paymentData);
      
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
        logger.error("Erro na Edge Function:", 'usePayment.processPayment', error);
        throw new Error(error.message || "Erro ao criar sessão de pagamento");
      }

      if (data?.url) {
  logger.debug("URL de checkout recebida:", 'usePayment.processPayment', { url: data.url });
        
        // Tentar abrir em nova aba com detecção melhorada de popup bloqueado
          try {
            logger.debug("Tentando abrir Stripe em nova aba...", 'usePayment.processPayment');
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
              logger.info("Pop-up foi bloqueado - oferecendo alternativa manual", 'usePayment.processPayment');
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
              logger.debug("Nova aba aberta com sucesso - redirecionando página original", 'usePayment.processPayment');
              
              // Monitorar fechamento da aba
              const checkClosed = setInterval(() => {
                if (newWindow.closed) {
                  logger.debug("Aba do Stripe foi fechada", 'usePayment.processPayment');
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
          logger.error("Erro ao abrir popup:", 'usePayment.processPayment', popupError);
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
      logger.error('Erro no pagamento:', 'usePayment.processPayment', error);
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

  // Stable wrapped functions
  const processPaymentCb = useCallback(processPayment, [user, toast]);

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
  logger.debug("Criando sessão do portal do cliente", 'usePayment.createCustomerPortalSession');
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          returnUrl: `${window.location.origin}/financeiro`
        }
      });

      if (error) {
        logger.error("Erro na Edge Function:", 'usePayment.createCustomerPortalSession', error);
        
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
        logger.debug("URL do portal recebida:", 'usePayment.createCustomerPortalSession', { url: data.url });
        window.open(data.url, '_blank');
        return { success: true };
      } else {
        throw new Error('URL do portal não foi retornada');
      }
    } catch (error) {
      logger.error('Erro ao abrir portal do cliente:', 'usePayment.createCustomerPortalSession', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível abrir o portal do cliente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  const createCustomerPortalSessionCb = useCallback(createCustomerPortalSession, [user, toast]);

  const verifyPayment = async (consultaId: string) => {
    try {
      logger.debug("usePayment: Verificando pagamento para consulta:", 'usePayment.verifyPayment', { consultaId });
      
      // Fase 3: Dual-read - consultar payments primeiro, depois verify-payment edge function
      let paymentFound = false;
      let paymentData = null;
      
      try {
        // Tentar buscar na nova tabela payments primeiro
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('consultation_id', consultaId)
          .single();
          
        if (!paymentsError && paymentsData) {
          logger.debug("usePayment: Pagamento encontrado na tabela payments:", 'usePayment.verifyPayment', paymentsData);
          paymentFound = true;
          paymentData = paymentsData;
          
          if (paymentsData.status === 'paid') {
            logger.info("usePayment: Pagamento confirmado na tabela payments!", 'usePayment.verifyPayment');
            toast({
              title: "Pagamento confirmado!",
              description: "Sua consulta foi agendada com sucesso.",
            });
            
            window.dispatchEvent(new CustomEvent('consultaUpdated'));
            return { success: true, paid: true, data: paymentData };
          }
        }
      } catch (e) {
          logger.warn("usePayment: Erro ao consultar payments, usando fallback:", 'usePayment.verifyPayment', e);
      }
      
      // Fallback: usar edge function verify-payment (que consulta ambas as tabelas)
      if (!paymentFound) {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { consulta_id: consultaId }
        });

        logger.debug("usePayment: Resposta do verify-payment:", 'usePayment.verifyPayment', data);

        if (error) {
          logger.error("usePayment: Erro na função verify-payment:", 'usePayment.verifyPayment', error);
          throw error;
        }

        if (data.success && data.payment_status === 'paid') {
          logger.info("usePayment: Pagamento confirmado via edge function!", 'usePayment.verifyPayment');
          toast({
            title: "Pagamento confirmado!",
            description: "Sua consulta foi agendada com sucesso.",
          });
          
          window.dispatchEvent(new CustomEvent('consultaUpdated'));
          return { success: true, paid: true, data: data.consulta };
        } else if (data.success) {
          logger.debug("usePayment: Pagamento ainda não processado", 'usePayment.verifyPayment');
          toast({
            title: "Pagamento em processamento",
            description: "O pagamento ainda está sendo processado. Tente novamente em alguns minutos.",
            variant: "default"
          });
          return { success: true, paid: false };
        }
      }
      
      return { success: false, paid: false };
    } catch (error) {
      logger.error('usePayment: Erro ao verificar pagamento:', 'usePayment.verifyPayment', error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o pagamento. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const verifyPaymentCb = useCallback(verifyPayment, [toast]);

  // Fase 3: Função para verificação automática de consultas pendentes com dual-read
  const checkPendingPayments = async () => {
    if (!user) return;

    try {
      logger.debug("Verificando consultas com pagamento pendente...", 'usePayment.checkPendingPayments');
      
      // Buscar na tabela legacy consultas (appointments table não existe ainda)
      const { data: consultas, error } = await supabase
        .from('consultas')
        .select('id, status_pagamento, created_at')
        .eq('paciente_id', user.id)
        .eq('status_pagamento', 'pendente')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        logger.error('Erro ao buscar consultas pendentes', 'usePayment.checkPendingPayments', error);
        return;
      }

      if (consultas && consultas.length > 0) {
        logger.info(`Encontradas ${consultas.length} consultas pendentes na tabela consultas`, 'usePayment.checkPendingPayments');
        
        // Verificar cada consulta
          for (const consulta of consultas) {
          try {
            await verifyPayment(consulta.id);
          } catch (e) {
            logger.error(`Erro ao verificar consulta ${consulta.id}:`, 'usePayment.checkPendingPayments', e);
          }
        }
      }
    } catch (error) {
      logger.error("Erro ao verificar pagamentos pendentes:", 'usePayment.checkPendingPayments', error);
    }
  };

  const checkPendingPaymentsCb = useCallback(checkPendingPayments, [user]);

  return {
    processing,
    processPayment: processPaymentCb,
    createCustomerPortalSession: createCustomerPortalSessionCb,
    verifyPayment: verifyPaymentCb,
    checkPendingPayments: checkPendingPaymentsCb
  };
};
