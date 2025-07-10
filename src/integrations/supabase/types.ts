export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      consultas: {
        Row: {
          agendado_por: string | null
          created_at: string
          data_consulta: string
          diagnostico: string | null
          duracao_minutos: number
          expires_at: string | null
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
          expires_at?: string | null
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
          expires_at?: string | null
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
      external_data_sources: {
        Row: {
          api_key: string
          created_at: string
          data_types: string[]
          description: string | null
          endpoint_url: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          data_types?: string[]
          description?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          data_types?: string[]
          description?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
      fhir_resources: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          patient_id: string
          resource_content: Json
          resource_type: string
          source_system: string | null
          version_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          patient_id: string
          resource_content: Json
          resource_type: string
          source_system?: string | null
          version_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          patient_id?: string
          resource_content?: Json
          resource_type?: string
          source_system?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fhir_resources_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_metrics: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          metric_type: string
          patient_id: string
          recorded_at: string
          unit: string
          value: Json
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          metric_type: string
          patient_id: string
          recorded_at?: string
          unit: string
          value: Json
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          metric_type?: string
          patient_id?: string
          recorded_at?: string
          unit?: string
          value?: Json
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          patient_id: string | null
          payload: Json | null
          source_id: string
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          patient_id?: string | null
          payload?: Json | null
          source_id: string
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          patient_id?: string | null
          payload?: Json | null
          source_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
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
      medical_prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          dosage: string
          duration_days: number | null
          frequency: string
          id: string
          instructions: string | null
          is_active: boolean
          medication_name: string
          patient_id: string
          prescribed_date: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          dosage: string
          duration_days?: number | null
          frequency: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          medication_name: string
          patient_id: string
          prescribed_date?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          dosage?: string
          duration_days?: number | null
          frequency?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          medication_name?: string
          patient_id?: string
          prescribed_date?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
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
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: number
          new_messages: boolean
          patient_reminders: boolean
          profile_id: string
          push_notifications: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: number
          new_messages?: boolean
          patient_reminders?: boolean
          profile_id: string
          push_notifications?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: number
          new_messages?: boolean
          patient_reminders?: boolean
          profile_id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
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
      patient_documents: {
        Row: {
          document_name: string
          document_type: string
          id: string
          patient_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          document_name: string
          document_type: string
          id?: string
          patient_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          document_name?: string
          document_type?: string
          id?: string
          patient_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_renewals: {
        Row: {
          created_at: string
          doctor_id: string
          doctor_notes: string | null
          id: string
          patient_id: string
          patient_notes: string | null
          prescription_id: string
          processed_date: string | null
          request_date: string
          requested_duration_days: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          doctor_notes?: string | null
          id?: string
          patient_id: string
          patient_notes?: string | null
          prescription_id: string
          processed_date?: string | null
          request_date?: string
          requested_duration_days?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          doctor_notes?: string | null
          id?: string
          patient_id?: string
          patient_notes?: string | null
          prescription_id?: string
          processed_date?: string | null
          request_date?: string
          requested_duration_days?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_renewals_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "medical_prescriptions"
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
      user_consents: {
        Row: {
          consent_version: string
          created_at: string
          granted_at: string
          id: string
          ip_address: unknown | null
          patient_id: string
          revoked_at: string | null
          source_id: string
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          consent_version?: string
          created_at?: string
          granted_at?: string
          id?: string
          ip_address?: unknown | null
          patient_id: string
          revoked_at?: string | null
          source_id: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          consent_version?: string
          created_at?: string
          granted_at?: string
          id?: string
          ip_address?: unknown | null
          patient_id?: string
          revoked_at?: string | null
          source_id?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
            referencedColumns: ["id"]
          },
        ]
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
      confirm_appointment_payment: {
        Args: { p_appointment_id: string; p_payment_intent_id: string }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      convert_health_metric_to_fhir: {
        Args: { metric_id: string }
        Returns: Json
      }
      convert_profile_to_fhir_patient: {
        Args: { profile_id: string }
        Returns: Json
      }
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
      reserve_appointment_slot: {
        Args: {
          p_doctor_id: string
          p_patient_id: string
          p_family_member_id: string
          p_scheduled_by_id: string
          p_appointment_datetime: string
          p_specialty: string
        }
        Returns: {
          success: boolean
          message: string
          appointment_id: string
        }[]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
