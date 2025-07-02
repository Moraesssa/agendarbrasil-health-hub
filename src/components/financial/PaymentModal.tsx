
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
      // PaymentModal deve permanecer aberto até redirecionamento completar
      // onPaymentSuccess?.(); // Removido para evitar fechamento prematuro
      // onClose(); // Removido para evitar fechamento prematuro
      
      // Modal se fechará automaticamente quando usuário voltar do Stripe
      console.log("Pagamento iniciado com sucesso, aguardando redirecionamento...");
    } else {
      // Só fechar em caso de erro
      setPaymentStarted(false);
    }
  };

  const handleModalClose = () => {
    // Não permitir fechar modal se pagamento já foi iniciado
    if (!paymentStarted && !processing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Pagamento da Consulta
            {!paymentStarted && !processing && (
              <Button variant="ghost" size="sm" onClick={handleModalClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mostrar estado de processamento */}
          {paymentStarted && (
            <div className="text-center py-4 bg-blue-50 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-blue-700 font-medium">Abrindo página de pagamento...</p>
              <p className="text-sm text-blue-600">Você será redirecionado para o Stripe em instantes</p>
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
                Você será redirecionado para o Stripe para finalizar o pagamento de forma segura.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
