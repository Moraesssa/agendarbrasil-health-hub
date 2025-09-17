import { 
  UnifiedAppointment, 
  AppointmentV2, 
  AppointmentLegacy,
  isLegacyAppointment,
  isV2Appointment,
  AppointmentConversionResult 
} from '@/types/appointments';
import { 
  UnifiedPayment, 
  PaymentV2, 
  PaymentLegacy,
  isLegacyPayment,
  isV2Payment,
  PaymentConversionResult 
} from '@/types/payments';
import { 
  UnifiedProfile, 
  ProfileV2,
  PatientLegacy,
  DoctorLegacy,
  isLegacyPatient,
  isLegacyDoctor,
  isV2Profile,
  ProfileConversionResult 
} from '@/types/profiles';
import { ValidationResult, TypeConversionResult } from '@/types/common';

// ============= Appointment Type Validation & Conversion =============

export function validateAppointmentType(appointment: any): ValidationResult {
  const errors: string[] = [];
  
  if (!appointment?.id) errors.push('ID is required');
  
  if (isV2Appointment(appointment)) {
    if (!appointment.patient_id) errors.push('Patient ID is required');
    if (!appointment.doctor_id) errors.push('Doctor ID is required');
    if (!appointment.scheduled_datetime) errors.push('Scheduled datetime is required');
    if (!appointment.appointment_type) errors.push('Appointment type is required');
  } else if (isLegacyAppointment(appointment)) {
    if (!appointment.paciente_id && !appointment.patient_name) {
      errors.push('Patient information is required');
    }
    if (!appointment.medico_id) errors.push('Doctor ID is required');
  } else {
    errors.push('Invalid appointment format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function convertLegacyToV2Appointment(legacy: AppointmentLegacy): AppointmentConversionResult {
  try {
    const id = legacy.id != null ? String(legacy.id) : '';
    const patientId = legacy.paciente_id != null ? String(legacy.paciente_id) : '';
    const doctorId = legacy.medico_id != null ? String(legacy.medico_id) : '';
    const createdAt = legacy.created_at || '';

    const v2: AppointmentV2 = {
      id,
      patient_id: patientId,
      doctor_id: doctorId,
      scheduled_datetime: legacy.consultation_date || createdAt,
      appointment_type: (legacy.consultation_type as any) || 'consultation',
      status: normalizeAppointmentStatus(legacy.status || 'pending'),
      notes: legacy.notes,
      created_at: createdAt,
      ...(createdAt ? { updated_at: createdAt } : {})
    };

    return {
      v2,
      source: 'legacy',
      converted: true
    };
  } catch (error) {
    // Return a minimal valid v2 appointment on conversion failure
    return {
      v2: {
        id: legacy.id != null ? String(legacy.id) : '',
        patient_id: legacy.paciente_id != null ? String(legacy.paciente_id) : '',
        doctor_id: legacy.medico_id != null ? String(legacy.medico_id) : '',
        scheduled_datetime: legacy.created_at || '',
        appointment_type: 'consultation',
        status: 'scheduled',
        created_at: legacy.created_at || '',
        ...(legacy.created_at ? { updated_at: legacy.created_at } : {})
      },
      source: 'legacy',
      converted: false
    };
  }
}

export function normalizeAppointment(appointment: UnifiedAppointment): AppointmentV2 {
  if (isV2Appointment(appointment)) {
    return appointment;
  }
  
  return convertLegacyToV2Appointment(appointment).v2;
}

function normalizeAppointmentStatus(status: string): AppointmentV2['status'] {
  const statusMap: Record<string, AppointmentV2['status']> = {
    'pending': 'scheduled',
    'agendada': 'scheduled',
    'confirmada': 'confirmed',
    'em_andamento': 'in_progress',
    'concluida': 'completed',
    'cancelada': 'cancelled',
    'faltou': 'no_show'
  };
  
  return statusMap[status.toLowerCase()] || 'scheduled';
}

// ============= Payment Type Validation & Conversion =============

export function validatePaymentType(payment: any): ValidationResult {
  const errors: string[] = [];
  
  if (!payment?.id) errors.push('ID is required');
  
  if (isV2Payment(payment)) {
    if (!payment.amount || payment.amount <= 0) errors.push('Valid amount is required');
    if (!payment.currency) errors.push('Currency is required');
    if (!payment.status) errors.push('Status is required');
  } else if (isLegacyPayment(payment)) {
    if (!payment.valor && !payment.amount) errors.push('Amount is required');
  } else {
    errors.push('Invalid payment format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function convertLegacyToV2Payment(legacy: PaymentLegacy): PaymentConversionResult {
  try {
    const rawAmount =
      typeof legacy.valor === 'number' ? legacy.valor : Number(legacy.valor ?? 0);
    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
    const currency = (legacy.moeda || 'brl').toLowerCase();
    const consultationId = legacy.consulta_id != null ? String(legacy.consulta_id) : undefined;
    const gatewayData = legacy.transacao_gateway;
    const metadata =
      gatewayData && typeof gatewayData === 'object' && !Array.isArray(gatewayData)
        ? (gatewayData as Record<string, any>)
        : undefined;

    const v2: PaymentV2 = {
      id: legacy.id != null ? String(legacy.id) : '',
      amount,
      currency,
      status: normalizePaymentStatus(legacy.status || 'pending'),
      payment_method: normalizePaymentMethod(
        typeof legacy.metodo === 'string' ? legacy.metodo : undefined
      ),
      consultation_id: consultationId,
      created_at: legacy.created_at || '',
      updated_at: legacy.created_at || ''
    };

    if (metadata) {
      v2.metadata = metadata;
    }

    if ('stripe_session_id' in legacy && typeof legacy.stripe_session_id === 'string') {
      v2.stripe_session_id = legacy.stripe_session_id;
    }

    if (
      'stripe_payment_intent_id' in legacy &&
      typeof legacy.stripe_payment_intent_id === 'string'
    ) {
      v2.stripe_payment_intent_id = legacy.stripe_payment_intent_id;
    }

    return {
      v2,
      source: 'legacy',
      converted: true
    };
  } catch (error) {
    return {
      v2: {
        id: legacy.id != null ? String(legacy.id) : '',
        amount: 0,
        currency: 'brl',
        status: 'pending',
        consultation_id:
          legacy.consulta_id != null ? String(legacy.consulta_id) : undefined,
        created_at: legacy.created_at || '',
        updated_at: legacy.created_at || ''
      },
      source: 'legacy',
      converted: false
    };
  }
}

export function normalizePayment(payment: UnifiedPayment): PaymentV2 {
  if (isV2Payment(payment)) {
    return payment;
  }
  
  return convertLegacyToV2Payment(payment).v2;
}

function normalizePaymentStatus(status: string): PaymentV2['status'] {
  const statusMap: Record<string, PaymentV2['status']> = {
    'pending': 'pending',
    'processing': 'processing',
    'paid': 'completed',
    'succeeded': 'completed',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'refunded': 'refunded'
  };
  
  return statusMap[status.toLowerCase()] || 'pending';
}

function normalizePaymentMethod(method?: string): PaymentV2['payment_method'] {
  if (!method) return undefined;
  
  const methodMap: Record<string, PaymentV2['payment_method']> = {
    'credit_card': 'credit_card',
    'debit_card': 'debit_card',
    'card': 'credit_card',
    'pix': 'pix',
    'bank_transfer': 'bank_transfer',
    'boleto': 'boleto'
  };
  
  return methodMap[method.toLowerCase()];
}

// ============= Profile Type Validation & Conversion =============

export function validateProfileType(profile: any): ValidationResult {
  const errors: string[] = [];
  
  if (!profile?.id) errors.push('ID is required');
  
  if (isV2Profile(profile)) {
    if (!profile.user_id) errors.push('User ID is required');
    if (!profile.full_name) errors.push('Full name is required');
    if (!profile.email) errors.push('Email is required');
    if (!profile.role) errors.push('Role is required');
  } else if (isLegacyPatient(profile) || isLegacyDoctor(profile)) {
    if (!profile.user_id) errors.push('User ID is required');
  } else {
    errors.push('Invalid profile format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function convertLegacyToV2Profile(legacy: PatientLegacy | DoctorLegacy): ProfileConversionResult {
  try {
    let v2: ProfileV2;
    let source: ProfileConversionResult['source'];
    
    if (isLegacyPatient(legacy)) {
      const dadosPessoais = legacy.dados_pessoais as any || {};
      const contato = legacy.contato as any || {};
      
      v2 = {
        id: legacy.id,
        user_id: legacy.user_id,
        role: 'patient',
        full_name: dadosPessoais.nome || dadosPessoais.full_name || '',
        email: contato.email || '',
        phone: contato.telefone || contato.phone,
        cpf: dadosPessoais.cpf,
        date_of_birth: dadosPessoais.data_nascimento,
        onboarding_completed: true, // Assume legacy users completed onboarding
        onboarding_status: 'completed',
        created_at: legacy.created_at || '',
        updated_at: legacy.created_at || ''
      };
      source = 'legacy_patient';
    } else {
      // isLegacyDoctor
      const dadosProfissionais = legacy.dados_profissionais as any || {};
      
      v2 = {
        id: legacy.id,
        user_id: legacy.user_id,
        role: 'doctor',
        full_name: dadosProfissionais.nome || '',
        email: dadosProfissionais.email || '',
        phone: legacy.telefone,
        onboarding_completed: true,
        onboarding_status: 'completed',
        created_at: legacy.created_at || '',
        updated_at: legacy.created_at || ''
      };
      source = 'legacy_doctor';
    }

    return {
      v2,
      source,
      converted: true
    };
  } catch (error) {
    return {
      v2: {
        id: legacy.id || '',
        user_id: legacy.user_id || '',
        role: 'patient',
        full_name: '',
        email: '',
        onboarding_completed: false,
        onboarding_status: 'pending',
        created_at: legacy.created_at || '',
        updated_at: legacy.created_at || ''
      },
      source: isLegacyPatient(legacy) ? 'legacy_patient' : 'legacy_doctor',
      converted: false
    };
  }
}

export function normalizeProfile(profile: UnifiedProfile): ProfileV2 {
  if (isV2Profile(profile)) {
    return profile;
  }
  
  return convertLegacyToV2Profile(profile).v2;
}

// ============= Batch Validation Utilities =============

export function validateAppointmentBatch(appointments: UnifiedAppointment[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  appointments.forEach((appointment, index) => {
    const result = validateAppointmentType(appointment);
    if (!result.valid) {
      errors.push(`Appointment ${index + 1}: ${result.errors.join(', ')}`);
    }
    
    if (isLegacyAppointment(appointment)) {
      warnings.push(`Appointment ${index + 1} is using legacy format`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validatePaymentBatch(payments: UnifiedPayment[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  payments.forEach((payment, index) => {
    const result = validatePaymentType(payment);
    if (!result.valid) {
      errors.push(`Payment ${index + 1}: ${result.errors.join(', ')}`);
    }
    
    if (isLegacyPayment(payment)) {
      warnings.push(`Payment ${index + 1} is using legacy format`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}