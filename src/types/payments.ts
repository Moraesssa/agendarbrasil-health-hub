import { Tables } from '@/integrations/supabase/types';

// ============= New Normalized Payment Types =============

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'boleto';

// New normalized payment type (v2)
export interface PaymentV2 {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  customer_name?: string;
  customer_email?: string;
  metadata?: Record<string, any>;
  consultation_id?: string;
  created_at: string;
  updated_at: string;
}

// Legacy payment type (from pagamentos table)
export type PaymentLegacy = Tables<'pagamentos'>;

// Union type for transition period - supports both schemas
export type UnifiedPayment = PaymentV2 | PaymentLegacy;

// ============= Payment-related Types =============

export interface PaymentDetails extends PaymentV2 {
  appointment_details?: {
    date: string;
    doctor_name: string;
    patient_name: string;
  };
}

export interface PaymentFilters {
  status?: PaymentStatus[];
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethod[];
}

export interface PaymentStats {
  total_amount: number;
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  refunded_amount: number;
}

export interface PaymentVerificationResult {
  verified: boolean;
  payment?: UnifiedPayment;
  source: 'v2' | 'legacy' | 'stripe';
  status: PaymentStatus;
}

// ============= Type Guards =============

export function isLegacyPayment(payment: UnifiedPayment): payment is PaymentLegacy {
  return 'valor' in payment || 'forma_pagamento' in payment;
}

export function isV2Payment(payment: UnifiedPayment): payment is PaymentV2 {
  return 'amount' in payment && !('valor' in payment);
}

// ============= Conversion Types =============

export interface PaymentConversionResult {
  v2: PaymentV2;
  source: 'legacy' | 'v2';
  converted: boolean;
}