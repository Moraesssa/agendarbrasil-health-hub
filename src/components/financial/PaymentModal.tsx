
import React, { useState } from 'react';
import { CreditCard, QrCode, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultaData: {
    id: string;
    valor: number;
    medicoNome: string;
    dataConsulta: string;
    especialidade: string;
  };
  onPaymentSuccess: () => void;
}

export const PaymentModal = ({ isOpen, onClose, consultaData, onPaymentSuccess }: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'credit_card' | 'pix' | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setProcessing(true);
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Sua consulta foi confirmada.",
      });
      
      onPaymentSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Pagamento da Consulta
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Métodos de pagamento */}
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
                  <div className="text-sm text-gray-500">Pagamento instantâneo</div>
                </div>
                <Badge variant="secondary">Recomendado</Badge>
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
                Processando...
              </>
            ) : (
              `Pagar ${consultaData.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
