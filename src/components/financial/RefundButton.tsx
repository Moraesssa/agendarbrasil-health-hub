import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { RefundModal } from "./RefundModal";

interface RefundButtonProps {
  paymentData: {
    id: string;
    valor: number;
    consulta_id: string;
    status: string;
    paciente_nome?: string;
    data_consulta?: string;
  };
  onRefundSuccess?: () => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export const RefundButton = ({ 
  paymentData, 
  onRefundSuccess, 
  size = "sm", 
  variant = "outline" 
}: RefundButtonProps) => {
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Verificar se o pagamento é elegível para reembolso
  const canRefund = paymentData.status === 'succeeded';

  if (!canRefund) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowRefundModal(true)}
        className="flex items-center gap-1"
      >
        <RotateCcw className="h-3 w-3" />
        Reembolsar
      </Button>

      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        paymentData={paymentData}
        onRefundSuccess={() => {
          onRefundSuccess?.();
          setShowRefundModal(false);
        }}
      />
    </>
  );
};