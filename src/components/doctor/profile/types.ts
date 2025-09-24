import { LucideIcon } from "lucide-react";

export interface DoctorHeroAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary";
}

export interface DoctorStatusBadge {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export interface DoctorStat {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
}

export type AppointmentStatus = "confirmada" | "pendente" | "cancelada";

export interface DoctorAppointment {
  id: string;
  patientName: string;
  start: Date;
  end?: Date;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  location?: string;
}

export type NotificationType = "info" | "warning" | "success";

export interface DoctorNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
}

export interface DoctorQuickLink {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}
