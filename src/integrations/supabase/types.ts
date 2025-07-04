export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      consultas: {
        Row: {
          agendado_por: string | null
          created_at: string
          data_consulta: string
          diagnostico: string | null
          duracao_minutos: number
          follow_up_required: boolean | null
          id: string
          local_consulta: string | null
          local_id: string | null
          medico_id: string
          motivo: string | null
          notas_medico: string | null
          paciente_familiar_id: string | null
          paciente_id: string
          preparation_completed: boolean | null
          service_type: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          status_pagamento: string | null
          tipo_consulta: string | null
          triage_id: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          agendado_por?: string | null
          created_at?: string
          data_consulta: string
          diagnostico?: string | null
          duracao_minutos?: number
          follow_up_required?: boolean | null
          id?: string
          local_consulta?: string | null
          local_id?: string | null
          medico_id: string
          motivo?: string | null
          notas_medico?: string | null
          paciente_familiar_id?: string | null
          paciente_id: string
          preparation_completed?: boolean | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          status_pagamento?: string | null
          tipo_consulta?: string | null
          triage_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          agendado_por?: string | null
          created_at?: string
          data_consulta?: string
          diagnostico?: string | null
          duracao_minutos?: number
          follow_up_required?: boolean | null
          id?: string
          local_consulta?: string | null
          local_id?: string | null
          medico_id?: string
          motivo?: string | null
          notas_medico?: string | null
          paciente_familiar_id?: string | null
          paciente_id?: string
          preparation_completed?: boolean | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          status_pagamento?: string | null
          tipo_consulta?: string | null
          triage_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultas_agendado_por_fkey"
            columns: ["agendado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_paciente_familiar_id_fkey"
            columns: ["paciente_familiar_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_triage_id_fkey"
            columns: ["triage_id"]
            isOneToOne: false
            referencedRelation: "medical_triage"
            referencedColumns: ["id"]
          },
        ]
      }
      encaminhamentos: {
        Row: {
          created_at: string
          data_encaminhamento: string
          data_resposta: string | null
          especialidade: string
          id: string
          medico_destino_id: string | null
          medico_origem_id: string
          motivo: string
          observacoes: string | null
          paciente_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_encaminhamento?: string
          data_resposta?: string | null
          especialidade: string
          id?: string
          medico_destino_id?: string | null
          medico_origem_id: string
          motivo: string
          observacoes?: string | null
          paciente_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_encaminhamento?: string
          data_resposta?: string | null
          especialidade?: string
          id?: string
          medico_destino_id?: string | null
          medico_origem_id?: string
          motivo?: string
          observacoes?: string | null
          paciente_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encaminhamentos_medico_destino_id_fkey"
            columns: ["medico_destino_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_medico_origem_id_fkey"
            columns: ["medico_origem_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidades_medicas: {
        Row: {
          ativa: boolean | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          can_cancel: boolean
          can_schedule: boolean
          can_view_history: boolean
          created_at: string
          family_member_id: string
          id: string
          permission_level: string
          relationship: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_cancel?: boolean
          can_schedule?: boolean
          can_view_history?: boolean
          created_at?: string
          family_member_id: string
          id?: string
          permission_level?: string
          relationship: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_cancel?: boolean
          can_schedule?: boolean
          can_view_history?: boolean
          created_at?: string
          family_member_id?: string
          id?: string
          permission_level?: string
          relationship?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_notifications: {
        Row: {
          action_required: boolean | null
          action_url: string | null
          created_at: string
          id: string
          message: string
          notification_type: string
          patient_id: string
          priority: string
          read: boolean | null
          scheduled_for: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_required?: boolean | null
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          notification_type: string
          patient_id: string
          priority?: string
          read?: boolean | null
          scheduled_for?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_required?: boolean | null
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          patient_id?: string
          priority?: string
          read?: boolean | null
          scheduled_for?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locais_atendimento: {
        Row: {
          ativo: boolean
          created_at: string
          endereco: Json
          id: string
          medico_id: string
          nome_local: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          endereco: Json
          id?: string
          medico_id: string
          nome_local: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          endereco?: Json
          id?: string
          medico_id?: string
          nome_local?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locais_atendimento_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_metrics: {
        Row: {
          id: string
          patient_id: string
          appointment_id: string | null
          metric_type: string
          value: Json
          unit: string
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          appointment_id?: string | null
          metric_type: string
          value: Json
          unit: string
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          appointment_id?: string | null
          metric_type?: string
          value?: Json
          unit?: string
          recorded_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_metrics_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_exams: {
        Row: {
          completed_date: string | null
          created_at: string
          created_by: string
          exam_name: string
          exam_type: string
          healthcare_provider: string | null
          id: string
          patient_id: string
          preparation_instructions: string | null
          preparation_required: boolean | null
          results_available: boolean | null
          results_summary: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
          urgent: boolean | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          created_by: string
          exam_name: string
          exam_type: string
          healthcare_provider?: string | null
          id?: string
          patient_id: string
          preparation_instructions?: string | null
          preparation_required?: boolean | null
          results_available?: boolean | null
          results_summary?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          urgent?: boolean | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          created_by?: string
          exam_name?: string
          exam_type?: string
          healthcare_provider?: string | null
          id?: string
          patient_id?: string
          preparation_instructions?: string | null
          preparation_required?: boolean | null
          results_available?: boolean | null
          results_summary?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          urgent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_exams_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preparation_instructions: string | null
          requires_preparation: boolean | null
          typical_duration: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preparation_instructions?: string | null
          requires_preparation?: boolean | null
          typical_duration?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preparation_instructions?: string | null
          requires_preparation?: boolean | null
          typical_duration?: number | null
        }
        Relationships: []
      }
      medical_triage: {
        Row: {
          created_at: string
          created_by: string
          id: string
          initial_guidance: string | null
          patient_id: string
          recommended_specialties: string[] | null
          status: string
          symptoms: string[]
          updated_at: string
          urgency_level: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          initial_guidance?: string | null
          patient_id: string
          recommended_specialties?: string[] | null
          status?: string
          symptoms: string[]
          updated_at?: string
          urgency_level: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          initial_guidance?: string | null
          patient_id?: string
          recommended_specialties?: string[] | null
          status?: string
          symptoms?: string[]
          updated_at?: string
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_triage_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_triage_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_doses: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reminder_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          taken_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id: string
          scheduled_date: string
          scheduled_time: string
          status?: string
          taken_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          taken_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_doses_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "medication_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_reminders: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          instructions: string | null
          is_active: boolean
          medication_name: string
          start_date: string
          times: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          medication_name: string
          start_date?: string
          times?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          medication_name?: string
          start_date?: string
          times?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medicos: {
        Row: {
          configuracoes: Json
          created_at: string
          crm: string
          dados_profissionais: Json
          especialidades: string[]
          id: string
          registro_especialista: string | null
          telefone: string
          updated_at: string
          user_id: string
          verificacao: Json
          whatsapp: string | null
        }
        Insert: {
          configuracoes?: Json
          created_at?: string
          crm: string
          dados_profissionais?: Json
          especialidades?: string[]
          id?: string
          registro_especialista?: string | null
          telefone: string
          updated_at?: string
          user_id: string
          verificacao?: Json
          whatsapp?: string | null
        }
        Update: {
          configuracoes?: Json
          created_at?: string
          crm?: string
          dados_profissionais?: Json
          especialidades?: string[]
          id?: string
          registro_especialista?: string | null
          telefone?: string
          updated_at?: string
          user_id?: string
          verificacao?: Json
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          contato: Json
          convenio: Json
          created_at: string
          dados_medicos: Json
          dados_pessoais: Json
          endereco: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contato?: Json
          convenio?: Json
          created_at?: string
          dados_medicos?: Json
          dados_pessoais?: Json
          endereco?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contato?: Json
          convenio?: Json
          created_at?: string
          dados_medicos?: Json
          dados_pessoais?: Json
          endereco?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          consulta_id: string | null
          created_at: string | null
          dados_gateway: Json | null
          gateway_id: string | null
          id: string
          medico_id: string
          metodo_pagamento: string
          original_payment_id: string | null
          paciente_id: string
          refund_id: string | null
          refund_reason: string | null
          refunded_amount: number | null
          refunded_at: string | null
          status: string
          valor: number
        }
        Insert: {
          consulta_id?: string | null
          created_at?: string | null
          dados_gateway?: Json | null
          gateway_id?: string | null
          id?: string
          medico_id: string
          metodo_pagamento: string
          original_payment_id?: string | null
          paciente_id: string
          refund_id?: string | null
          refund_reason?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          status: string
          valor: number
        }
        Update: {
          consulta_id?: string | null
          created_at?: string | null
          dados_gateway?: Json | null
          gateway_id?: string | null
          id?: string
          medico_id?: string
          metodo_pagamento?: string
          original_payment_id?: string | null
          paciente_id?: string
          refund_id?: string | null
          refund_reason?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_original_payment_id_fkey"
            columns: ["original_payment_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          onboarding_completed: boolean
          photo_url: string | null
          preferences: Json | null
          user_type: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_active?: boolean
          last_login?: string | null
          onboarding_completed?: boolean
          photo_url?: string | null
          preferences?: Json | null
          user_type?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          onboarding_completed?: boolean
          photo_url?: string | null
          preferences?: Json | null
          user_type?: string | null
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          administered_date: string | null
          adverse_reactions: string | null
          batch_number: string | null
          created_at: string
          created_by: string
          dose_number: number | null
          healthcare_provider: string | null
          id: string
          next_dose_date: string | null
          patient_id: string
          status: string
          total_doses: number | null
          updated_at: string
          vaccine_name: string
          vaccine_type: string
        }
        Insert: {
          administered_date?: string | null
          adverse_reactions?: string | null
          batch_number?: string | null
          created_at?: string
          created_by: string
          dose_number?: number | null
          healthcare_provider?: string | null
          id?: string
          next_dose_date?: string | null
          patient_id: string
          status?: string
          total_doses?: number | null
          updated_at?: string
          vaccine_name: string
          vaccine_type: string
        }
        Update: {
          administered_date?: string | null
          adverse_reactions?: string | null
          batch_number?: string | null
          created_at?: string
          created_by?: string
          dose_number?: number | null
          healthcare_provider?: string | null
          id?: string
          next_dose_date?: string | null
          patient_id?: string
          status?: string
          total_doses?: number | null
          updated_at?: string
          vaccine_name?: string
          vaccine_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_cities: {
        Args: { state_uf: string }
        Returns: {
          cidade: string
        }[]
      }
      get_available_states: {
        Args: Record<PropertyKey, never>
        Returns: {
          uf: string
        }[]
      }
      get_doctors_by_location_and_specialty: {
        Args: { p_specialty: string; p_city: string; p_state: string }
        Returns: {
          id: string
          display_name: string
        }[]
      }
      get_family_members: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          family_member_id: string
          display_name: string
          email: string
          relationship: string
          permission_level: string
          can_schedule: boolean
          can_view_history: boolean
          can_cancel: boolean
          status: string
        }[]
      }
      get_family_upcoming_activities: {
        Args: { user_uuid: string }
        Returns: {
          activity_type: string
          patient_name: string
          patient_id: string
          title: string
          scheduled_date: string
          urgency: string
          status: string
        }[]
      }
      get_my_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          ativo: boolean
          created_at: string
          endereco: Json
          id: string
          medico_id: string
          nome_local: string
          telefone: string | null
        }[]
      }
      get_specialties: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      appointment_status:
        | "agendada"
        | "confirmada"
        | "cancelada"
        | "realizada"
        | "pendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "agendada",
        "confirmada",
        "cancelada",
        "realizada",
        "pendente",
      ],
    },
  },
} as const
