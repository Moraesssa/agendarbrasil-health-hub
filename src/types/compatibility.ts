// Legacy stub - compatibility layer removed
export interface CompatibleDoctor {
  id: string;
  display_name?: string;
  nome?: string;
}

export interface CompatiblePatient {
  id: string;
  display_name?: string;
  nome?: string;
}

export interface CompatibleAppointment {
  id: string;
  medico_id?: string;
  paciente_id?: string;
}

export interface CompatibleSearchFilters {
  specialty?: string;
  city?: string;
  state?: string;
}

export interface CompatibleLocation {
  id: string;
  nome_local?: string;
}

export const toCompatibleDoctor = (d: any) => ({ id: String(d?.id), display_name: d?.display_name || d?.nome });
export const toCompatiblePatient = (p: any) => ({ id: String(p?.id), display_name: p?.display_name || p?.nome });
export const toCompatibleAppointment = (a: any) => ({ id: String(a?.id) });
export const toCompatibleLocation = (l: any) => ({ id: String(l?.id) });
