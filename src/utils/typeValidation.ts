// Legacy stub
export function validateAppointmentType() { return { valid: true, errors: [] }; }
export function validatePaymentType() { return { valid: true, errors: [] }; }
export function validateProfileType() { return { valid: true, errors: [] }; }
export function convertLegacyToV2Appointment(data: any) { return { v2: data, source: 'legacy', converted: true }; }
export function convertLegacyToV2Payment(data: any) { return { v2: data, source: 'legacy', converted: true }; }
export function convertLegacyToV2Profile(data: any) { return { v2: data, source: 'legacy', converted: true }; }
export function normalizeAppointment(data: any) { return data; }
export function normalizePayment(data: any) { return data; }
export function normalizeProfile(data: any) { return data; }
export function validateAppointmentBatch() { return { valid: true, errors: [] }; }
export function validatePaymentBatch() { return { valid: true, errors: [] }; }
