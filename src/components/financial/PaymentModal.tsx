
import React, { useState } from 'react';
import { CreditCard, QrCode, X, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePayment } from "@/hooks/usePayment";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultaData: {
    id: string;
    valor: number;
    medicoNome: string;
    medicoId: string;
    dataConsulta: string;
    especialidade: string;
  };
  onPaymentSuccess?: () => void;
}

export const PaymentModal = ({ isOpen, onClose, consultaData, onPaymentSuccess }: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'credit_card' | 'pix' | null>(null);
  const { processing, processPayment } = usePayment();
  const [paymentStarted, setPaymentStarted] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setPaymentStarted(true);
    
    const result = await processPayment({
      consultaId: consultaData.id,
      medicoId: consultaData.medicoId,
      valor: consultaData.valor,
      metodo: selectedMethod
    });

    if (result.success) {
      console.log("Pagamento iniciado com sucesso - modal permanecerá aberto");
      // Modal permanece aberto para permitir monitoramento
    } else {
      // Só resetar em caso de erro real
      setPaymentStarted(false);
    }
  };

  const handleModalClose = () => {
    // Só permitir fechar se não há processamento ativo
    if (!processing && !paymentStarted) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Pagamento da Consulta
            {!processing && !paymentStarted && (
              <Button variant="ghost" size="sm" onClick={handleModalClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado de processamento */}
          {paymentStarted && (
            <div className="text-center py-4 bg-blue-50 rounded-lg">
              <ExternalLink className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-blue-700 font-medium">Pagamento sendo processado</p>
              <p className="text-sm text-blue-600">
                Uma nova aba deve ter aberto com o Stripe.<br/>
                Se não abriu, verifique se permitiu pop-ups.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setPaymentStarted(false);
                  onClose();
                }}
              >
                Fechar Modal
              </Button>
            </div>
          )}

          {/* Resumo da consulta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Médico:</span>
                <span className="font-medium">{consultaData.medicoNome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Especialidade:</span>
                <span>{consultaData.especialidade}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Data:</span>
                <span>{new Date(consultaData.dataConsulta).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total:</span>
                <span className="text-green-600">
                  {consultaData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Métodos de pagamento - só mostrar se não iniciou pagamento */}
          {!paymentStarted && (
            <>
              <div className="space-y-3">
                <h3 className="font-medium">Escolha a forma de pagamento:</h3>
                
                <Card 
                  className={`cursor-pointer transition-colors ${selectedMethod === 'credit_card' ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedMethod('credit_card')}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium">Cartão de Crédito</div>
                      <div className="text-sm text-gray-500">Processado pelo Stripe</div>
                    </div>
                    <Badge variant="secondary">Seguro</Badge>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${selectedMethod === 'pix' ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedMethod('pix')}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <QrCode className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium">PIX</div>
                      <div className="text-sm text-gray-500">Transferência instantânea</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Botão de pagamento */}
              <Button 
                onClick={handlePayment}
                disabled={!selectedMethod || processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparando pagamento...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Pagar {consultaData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                O pagamento abrirá em uma nova aba do Stripe.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
