import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    id: string;
    valor: number;
    consulta_id: string;
    paciente_nome?: string;
    data_consulta?: string;
  };
  onRefundSuccess?: () => void;
}

export const RefundModal = ({ isOpen, onClose, paymentData, onRefundSuccess }: RefundModalProps) => {
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(paymentData.valor.toString());
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo do reembolso.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isPartialRefund && (amount <= 0 || amount > paymentData.valor)) {
      toast({
        title: "Valor inválido",
        description: "O valor do reembolso deve ser maior que zero e não pode exceder o valor pago.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      console.log("Iniciando reembolso:", {
        paymentId: paymentData.id,
        reason: reason.trim(),
        amount: isPartialRefund ? amount : undefined
      });

      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          paymentId: paymentData.id,
          reason: reason.trim(),
          amount: isPartialRefund ? amount : undefined
        }
      });

      if (error) {
        console.error("Erro na edge function:", error);
        throw new Error(error.message || "Erro ao processar reembolso");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log("Reembolso processado com sucesso:", data);

      toast({
        title: "Reembolso processado",
        description: `Reembolso de ${data.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} processado com sucesso.`,
        variant: "default"
      });

      onRefundSuccess?.();
      onClose();

    } catch (error) {
      console.error('Erro ao processar reembolso:', error);
      toast({
        title: "Erro no reembolso",
        description: error instanceof Error ? error.message : "Não foi possível processar o reembolso. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleModalClose = () => {
    if (!processing) {
      setReason('');
      setRefundAmount(paymentData.valor.toString());
      setIsPartialRefund(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Processar Reembolso
            </span>
            {!processing && (
              <Button variant="ghost" size="sm" onClick={handleModalClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do pagamento */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Paciente:</span>
                <span className="font-medium">{paymentData.paciente_nome || 'N/A'}</span>
              </div>
              {paymentData.data_consulta && (
                <div className="flex justify-between text-sm">
                  <span>Data da consulta:</span>
                  <span>{new Date(paymentData.data_consulta).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-green-600 pt-2 border-t">
                <span>Valor pago:</span>
                <span>{paymentData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de reembolso */}
          <div className="space-y-3">
            <Label>Tipo de reembolso</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="full-refund"
                  checked={!isPartialRefund}
                  onChange={() => {
                    setIsPartialRefund(false);
                    setRefundAmount(paymentData.valor.toString());
                  }}
                  disabled={processing}
                />
                <Label htmlFor="full-refund" className="cursor-pointer">
                  Reembolso total - {paymentData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="partial-refund"
                  checked={isPartialRefund}
                  onChange={() => setIsPartialRefund(true)}
                  disabled={processing}
                />
                <Label htmlFor="partial-refund" className="cursor-pointer">
                  Reembolso parcial
                </Label>
              </div>
            </div>
          </div>

          {/* Valor do reembolso parcial */}
          {isPartialRefund && (
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Valor do reembolso</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={paymentData.valor}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={processing}
                placeholder="0,00"
              />
            </div>
          )}

          {/* Motivo do reembolso */}
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Motivo do reembolso *</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={processing}
              placeholder="Descreva o motivo do reembolso..."
              rows={3}
            />
          </div>

          {/* Aviso */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. O valor será reembolsado no método de pagamento original do paciente.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleModalClose}
              disabled={processing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRefund}
              disabled={processing || !reason.trim()}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {processing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Processar Reembolso
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};