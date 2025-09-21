// EMERGENCY TYPE FIXES - TEMPORARY UNTIL SCHEMA NORMALIZATION
// ⚠️ Remove this file after proper database schema consolidation

// Safe type assertions for build fixes
export const safeDoctorAccess = (doctor: any, prop: string): any => {
  if (!doctor) return '';
  return doctor[prop] || '';
};

export const safeAppointmentAccess = (appointment: any, prop: string): any => {
  if (!appointment) return '';
  return appointment[prop] || '';
};

// Emergency type conversion for Doctor objects
export const fixDoctorType = (doctor: any): any => {
  if (!doctor) return {};
  
  return {
    ...doctor,
    foto_perfil_url: doctor.foto_perfil_url || doctor.photo_url || '',
    rating: doctor.rating || 0,
    total_avaliacoes: doctor.total_avaliacoes || 0,
    bio_perfil: doctor.bio_perfil || '',
    especialidade: doctor.especialidade || '',
    duracao_consulta_inicial: doctor.duracao_consulta_inicial || 30,
    aceita_consulta_presencial: doctor.aceita_consulta_presencial ?? true,
    aceita_teleconsulta: doctor.aceita_teleconsulta ?? true,
    observacoes_medico: doctor.observacoes_medico || ''
  };
};

export const fixAppointmentType = (appointment: any): any => {
  if (!appointment) return {};
  
  return {
    ...appointment,
    prioridade: appointment.prioridade || 'normal',
    observacoes_medico: appointment.observacoes_medico || ''
  };
};

// Console warning
console.warn('🚨 USING EMERGENCY TYPE FIXES - REMOVE AFTER SCHEMA NORMALIZATION');