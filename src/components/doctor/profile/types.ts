import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { ButtonProps } from "@/components/ui/button";
import { BaseUser } from "@/types/user";

type ButtonVariant = ButtonProps["variant"];

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

export interface DoctorProfileData {
  id: string;
  nome?: string;
  especialidades?: string[];
  rating?: number;
  total_avaliacoes?: number;
}

export interface ConsultaData {
  id: string;
  patient_name?: string;
  consultation_date: string;
  consultation_type?: string;
  status?: string;
}

export interface DoctorAppointment {
  id: string;
  patientName: string;
  type: string;
  start: Date;
  end?: Date;
  location?: string;
  notes?: string;
  status:
    | "scheduled"
    | "completed"
    | "cancelled"
    | "confirmada"
    | "pendente"
    | "cancelada";
}

export type DoctorNotificationType =
  | "appointment"
  | "system"
  | "message"
  | "info"
  | "warning"
  | "success";

export interface DoctorNotification {
  id: string;
  type: DoctorNotificationType;
  title: string;
  description: string;
  time: string;
}

export interface DoctorQuickLink {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: ButtonVariant;
}

export interface DoctorStatTrend {
  value: string;
  isPositive?: boolean;
  label?: string;
}

export interface DoctorStat {
  label: string;
  value: string;
  description?: string;
  trend?: DoctorStatTrend;
  icon: LucideIcon;
}

export interface DoctorStatusBadge {
  label: string;
  variant: StatusVariant;
}

export interface DoctorHeroAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: ButtonVariant;
}

export interface DoctorHeroProps {
  name?: string | null;
  email?: string | null;
  crm?: string | null;
  specialties?: string[] | null;
  avatarUrl?: string | null;
  statusBadges?: DoctorStatusBadge[];
  primaryAction?: DoctorHeroAction;
  secondaryAction?: DoctorHeroAction;
  editProfileAction?: ReactNode;
  loading?: boolean;
}

export interface DoctorProfileTabsProps {
  doctor: BaseUser | null;
  loading?: boolean;
}
