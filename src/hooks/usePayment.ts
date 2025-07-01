
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { financeService } from '@/services/financeService';
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
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Registrar o pagamento no banco
      const result = await financeService.registrarPagamento({
        consulta_id: paymentData.consultaId,
        paciente_id: user.id,
        medico_id: paymentData.medicoId,
        valor: paymentData.valor,
        metodo_pagamento: paymentData.metodo,
        status: 'succeeded',
        gateway_id: `sim_${Date.now()}` // Simulação
      });

      if (result.success) {
        toast({
          title: "Pagamento realizado com sucesso!",
          description: "Sua consulta foi confirmada.",
        });
        return { success: true };
      } else {
        throw result.error;
      }
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    processPayment
  };
};
