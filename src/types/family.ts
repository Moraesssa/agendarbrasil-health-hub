
export interface FamilyMember {
  id: string;
  family_member_id: string;
  display_name: string;
  email: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  permission_level: 'admin' | 'manager' | 'viewer';
  can_schedule: boolean;
  can_view_history: boolean;
  can_cancel: boolean;
  status: 'active' | 'pending' | 'inactive';
}

export interface AddFamilyMemberData {
  email: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  permission_level: 'admin' | 'manager' | 'viewer';
  can_schedule: boolean;
  can_view_history: boolean;
  can_cancel: boolean;
}

export interface FamilyAppointmentData {
  paciente_id: string;
  medico_id: string;
  data_consulta: string;
  tipo_consulta: string;
  agendado_por: string;
  paciente_familiar_id?: string;
}
