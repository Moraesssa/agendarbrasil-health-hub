# Patente 3: Sistema de Gestão de Saúde Familiar Integrado

## TÍTULO DA INVENÇÃO

**Sistema e Método para Gestão Delegada de Agendamentos Médicos com Controle Granular de Permissões para Membros Familiares**

---

## 1. CAMPO TÉCNICO DA INVENÇÃO

A presente invenção refere-se ao campo de sistemas de gestão de saúde familiar, mais especificamente a um sistema computadorizado que permite a um usuário principal gerenciar agendamentos médicos, histórico de saúde e notificações de múltiplos membros familiares (dependentes, idosos, menores de idade) com controle granular de permissões e delegação de responsabilidades.

---

## 2. ANTECEDENTES DA INVENÇÃO

### 2.1 Estado da Técnica

Os sistemas de agendamento médico convencionais apresentam limitações para gestão familiar:

1. **Contas Individuais**: Cada membro da família precisa de conta própria
2. **Sem Delegação**: Impossibilidade de agendar consultas para terceiros
3. **Histórico Fragmentado**: Dados de saúde dispersos em múltiplas contas
4. **Notificações Isoladas**: Lembretes não consolidados para o cuidador principal
5. **Sem Controle de Permissões**: Acesso tudo-ou-nada aos dados

### 2.2 Problemas Técnicos a Resolver

- Permitir agendamento por procuração com validação de vínculo familiar
- Definir permissões granulares por tipo de ação (agendar, cancelar, visualizar histórico)
- Consolidar notificações de múltiplos familiares para o cuidador
- Manter privacidade de dados sensíveis entre familiares
- Rastrear quem agendou/cancelou em nome de quem

---

## 3. SUMÁRIO DA INVENÇÃO

A presente invenção propõe um sistema composto por:

1. **Módulo de Vínculos Familiares** - Gerencia relacionamentos com validação de parentesco
2. **Módulo de Permissões Granulares** - Define o que cada familiar pode fazer
3. **Módulo de Agendamento Delegado** - Permite agendar em nome de dependentes
4. **Módulo de Dashboard Consolidado** - Visão unificada de saúde da família
5. **Módulo de Notificações Inteligentes** - Alertas agregados para o cuidador

---

## 4. DESCRIÇÃO DETALHADA DA INVENÇÃO

### 4.1 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SISTEMA DE GESTÃO FAMILIAR                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │  Cuidador      │  │  Dependente 1  │  │  Dependente 2 (menor)     │ │
│  │  (Principal)   │  │  (Idoso)       │  │                            │ │
│  └───────┬────────┘  └───────┬────────┘  └─────────────┬──────────────┘ │
│          │                   │                         │                 │
│          └───────────────────┼─────────────────────────┘                 │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    MÓDULO DE VÍNCULOS                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │   │
│  │  │ Validação   │  │ Tipos de    │  │ Estados de              │   │   │
│  │  │ de Vínculo  │  │ Parentesco  │  │ Relacionamento          │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                 MÓDULO DE PERMISSÕES                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │   │
│  │  │ can_schedule│  │ can_cancel  │  │ can_view_history        │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │   │
│  │  │ Níveis:     │  │ Herança de  │  │ Auditoria de            │   │   │
│  │  │ admin/edit/ │  │ Permissões  │  │ Ações                   │   │   │
│  │  │ view        │  │             │  │                         │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │               MÓDULO DE AGENDAMENTO DELEGADO                      │   │
│  │  - Agendamento em nome do dependente                              │   │
│  │  - Validação de permissões antes de cada ação                     │   │
│  │  - Registro de quem agendou (scheduled_by_id)                     │   │
│  │  - Notificação ao dependente (se aplicável)                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                 DASHBOARD CONSOLIDADO                             │   │
│  │  - Próximas consultas de todos os familiares                      │   │
│  │  - Medicamentos e lembretes pendentes                             │   │
│  │  - Exames e vacinas a vencer                                      │   │
│  │  - Alertas de saúde prioritários                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Modelo de Dados

#### 4.2.1 Tabela de Vínculos Familiares

```sql
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário principal (cuidador)
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Membro da família (dependente)
  family_member_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Tipo de relacionamento
  relationship TEXT NOT NULL CHECK (relationship IN (
    'filho', 'filha',           -- Menores de idade
    'pai', 'mae',               -- Pais idosos
    'avo', 'avó',               -- Avós
    'conjuge', 'parceiro',      -- Cônjuge
    'irmao', 'irma',            -- Irmãos
    'neto', 'neta',             -- Netos
    'tio', 'tia',               -- Tios
    'sobrinho', 'sobrinha',     -- Sobrinhos
    'tutelado', 'dependente',   -- Tutela legal
    'outro'                     -- Outros
  )),
  
  -- Nível de permissão geral
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN (
    'admin',  -- Controle total
    'edit',   -- Pode agendar e cancelar
    'view'    -- Apenas visualizar
  )),
  
  -- Permissões específicas (granulares)
  can_schedule BOOLEAN NOT NULL DEFAULT true,
  can_cancel BOOLEAN NOT NULL DEFAULT false,
  can_view_history BOOLEAN NOT NULL DEFAULT true,
  can_view_prescriptions BOOLEAN NOT NULL DEFAULT false,
  can_view_exams BOOLEAN NOT NULL DEFAULT false,
  can_manage_medications BOOLEAN NOT NULL DEFAULT false,
  
  -- Status do vínculo
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Aguardando confirmação do dependente
    'active',     -- Vínculo ativo
    'suspended',  -- Temporariamente suspenso
    'revoked'     -- Revogado pelo dependente
  )),
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  
  -- Impedir duplicatas
  UNIQUE(user_id, family_member_id)
);

-- Índices para performance
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_family_members_family_member ON family_members(family_member_id);
CREATE INDEX idx_family_members_status ON family_members(status);
```

#### 4.2.2 Tabela de Notificações Familiares

```sql
CREATE TABLE public.family_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Para quem é a notificação (cuidador)
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Sobre quem é a notificação (dependente)
  patient_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Tipo de notificação
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'appointment_reminder',    -- Lembrete de consulta
    'appointment_confirmed',   -- Consulta confirmada
    'appointment_cancelled',   -- Consulta cancelada
    'medication_reminder',     -- Lembrete de medicamento
    'exam_pending',           -- Exame pendente
    'exam_results',           -- Resultados de exame
    'vaccination_due',        -- Vacina a vencer
    'health_alert',           -- Alerta de saúde
    'prescription_expiring',  -- Receita expirando
    'family_request'          -- Solicitação de vínculo
  )),
  
  -- Conteúdo
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Prioridade
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'urgent',  -- Vermelho - ação imediata
    'high',    -- Laranja - ação em 24h
    'normal',  -- Azul - informativo
    'low'      -- Cinza - pode ignorar
  )),
  
  -- Ação requerida
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Agendamento
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca eficiente
CREATE INDEX idx_family_notifications_user ON family_notifications(user_id, read);
CREATE INDEX idx_family_notifications_scheduled ON family_notifications(scheduled_for) 
  WHERE scheduled_for IS NOT NULL;
```

### 4.3 Serviço de Gestão Familiar

```typescript
// src/services/familyService.ts

interface FamilyMember {
  id: string;
  user_id: string;
  family_member_id: string;
  relationship: FamilyRelationship;
  permission_level: PermissionLevel;
  can_schedule: boolean;
  can_cancel: boolean;
  can_view_history: boolean;
  can_view_prescriptions: boolean;
  can_view_exams: boolean;
  can_manage_medications: boolean;
  status: FamilyMemberStatus;
  created_at: string;
  updated_at: string;
}

type FamilyRelationship = 
  | 'filho' | 'filha' 
  | 'pai' | 'mae' 
  | 'avo' | 'avó' 
  | 'conjuge' | 'parceiro'
  | 'irmao' | 'irma'
  | 'tutelado' | 'dependente'
  | 'outro';

type PermissionLevel = 'admin' | 'edit' | 'view';
type FamilyMemberStatus = 'pending' | 'active' | 'suspended' | 'revoked';

interface FamilyMemberWithProfile extends FamilyMember {
  profile: {
    id: string;
    display_name: string;
    email: string;
    photo_url: string | null;
  };
}

export class FamilyService {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  /**
   * Adiciona um novo membro familiar
   */
  async addFamilyMember(params: {
    userId: string;
    familyMemberEmail: string;
    relationship: FamilyRelationship;
    permissionLevel?: PermissionLevel;
    permissions?: Partial<FamilyPermissions>;
  }): Promise<{ success: boolean; member?: FamilyMember; error?: string }> {
    try {
      // Buscar perfil do membro familiar pelo email
      const { data: familyProfile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', params.familyMemberEmail)
        .single();
      
      if (profileError || !familyProfile) {
        return { 
          success: false, 
          error: 'Usuário não encontrado. Verifique se o email está correto.' 
        };
      }
      
      // Verificar se já existe vínculo
      const { data: existing } = await this.supabase
        .from('family_members')
        .select('id, status')
        .eq('user_id', params.userId)
        .eq('family_member_id', familyProfile.id)
        .single();
      
      if (existing) {
        if (existing.status === 'active') {
          return { success: false, error: 'Este familiar já está vinculado.' };
        }
        // Reativar vínculo existente
        const { data, error } = await this.supabase
          .from('family_members')
          .update({ 
            status: 'pending', 
            relationship: params.relationship,
            permission_level: params.permissionLevel || 'view',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Enviar notificação para o familiar
        await this.sendFamilyRequestNotification(familyProfile.id, params.userId);
        
        return { success: true, member: data };
      }
      
      // Criar novo vínculo
      const { data, error } = await this.supabase
        .from('family_members')
        .insert({
          user_id: params.userId,
          family_member_id: familyProfile.id,
          relationship: params.relationship,
          permission_level: params.permissionLevel || 'view',
          can_schedule: params.permissions?.can_schedule ?? true,
          can_cancel: params.permissions?.can_cancel ?? false,
          can_view_history: params.permissions?.can_view_history ?? true,
          can_view_prescriptions: params.permissions?.can_view_prescriptions ?? false,
          can_view_exams: params.permissions?.can_view_exams ?? false,
          can_manage_medications: params.permissions?.can_manage_medications ?? false,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Enviar notificação
      await this.sendFamilyRequestNotification(familyProfile.id, params.userId);
      
      return { success: true, member: data };
    } catch (error: any) {
      console.error('Erro ao adicionar familiar:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Confirma/aceita vínculo familiar
   */
  async confirmFamilyMember(
    familyMemberId: string, 
    membershipId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se o usuário é o familiar sendo adicionado
      const { data: membership, error: fetchError } = await this.supabase
        .from('family_members')
        .select('*')
        .eq('id', membershipId)
        .eq('family_member_id', familyMemberId)
        .single();
      
      if (fetchError || !membership) {
        return { success: false, error: 'Solicitação não encontrada.' };
      }
      
      if (membership.status !== 'pending') {
        return { success: false, error: 'Esta solicitação já foi processada.' };
      }
      
      // Atualizar status para ativo
      const { error } = await this.supabase
        .from('family_members')
        .update({
          status: 'active',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', membershipId);
      
      if (error) throw error;
      
      // Notificar o cuidador
      await this.supabase
        .from('family_notifications')
        .insert({
          user_id: membership.user_id,
          patient_id: familyMemberId,
          notification_type: 'family_request',
          title: 'Vínculo familiar confirmado',
          message: 'Seu familiar aceitou a solicitação de vínculo.',
          priority: 'normal'
        });
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao confirmar familiar:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Revoga vínculo familiar
   */
  async revokeFamilyMember(
    userId: string,
    membershipId: string,
    revokedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('family_members')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', membershipId)
        .or(`user_id.eq.${userId},family_member_id.eq.${userId}`);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao revogar familiar:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Lista familiares do usuário
   */
  async getFamilyMembers(userId: string): Promise<FamilyMemberWithProfile[]> {
    const { data, error } = await this.supabase
      .rpc('get_family_members', { user_uuid: userId });
    
    if (error) {
      console.error('Erro ao buscar familiares:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Verifica se usuário pode realizar ação para um familiar
   */
  async checkPermission(
    userId: string,
    familyMemberId: string,
    action: 'schedule' | 'cancel' | 'view_history' | 'view_prescriptions' | 'view_exams' | 'manage_medications'
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Se é o próprio usuário, sempre permite
    if (userId === familyMemberId) {
      return { allowed: true };
    }
    
    // Buscar vínculo
    const { data: membership, error } = await this.supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId)
      .eq('family_member_id', familyMemberId)
      .eq('status', 'active')
      .single();
    
    if (error || !membership) {
      return { 
        allowed: false, 
        reason: 'Você não tem vínculo ativo com este familiar.' 
      };
    }
    
    // Mapear ação para campo de permissão
    const permissionMap: Record<string, keyof FamilyMember> = {
      'schedule': 'can_schedule',
      'cancel': 'can_cancel',
      'view_history': 'can_view_history',
      'view_prescriptions': 'can_view_prescriptions',
      'view_exams': 'can_view_exams',
      'manage_medications': 'can_manage_medications'
    };
    
    const permissionField = permissionMap[action];
    
    // Admin tem todas as permissões
    if (membership.permission_level === 'admin') {
      return { allowed: true };
    }
    
    // Verificar permissão específica
    if (membership[permissionField]) {
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      reason: `Você não tem permissão para ${action.replace('_', ' ')} deste familiar.` 
    };
  }
  
  /**
   * Atualiza permissões de um familiar
   */
  async updatePermissions(
    userId: string,
    membershipId: string,
    permissions: Partial<FamilyPermissions>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('family_members')
        .update({
          ...permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', membershipId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar permissões:', error);
      return { success: false, error: error.message };
    }
  }
  
  private async sendFamilyRequestNotification(
    familyMemberId: string,
    requesterId: string
  ): Promise<void> {
    // Buscar nome do solicitante
    const { data: requester } = await this.supabase
      .from('profiles')
      .select('display_name')
      .eq('id', requesterId)
      .single();
    
    await this.supabase
      .from('family_notifications')
      .insert({
        user_id: familyMemberId,
        patient_id: familyMemberId,
        notification_type: 'family_request',
        title: 'Solicitação de vínculo familiar',
        message: `${requester?.display_name || 'Alguém'} quer adicionar você como familiar para gerenciar seus agendamentos de saúde.`,
        priority: 'high',
        action_required: true,
        action_url: '/paciente/familia/solicitacoes'
      });
  }
}

interface FamilyPermissions {
  can_schedule: boolean;
  can_cancel: boolean;
  can_view_history: boolean;
  can_view_prescriptions: boolean;
  can_view_exams: boolean;
  can_manage_medications: boolean;
  permission_level: PermissionLevel;
}
```

### 4.4 Serviço de Agendamento Familiar

```typescript
// src/services/familyAppointmentService.ts

interface FamilyAppointmentParams {
  doctorId: string;
  appointmentDatetime: string;
  specialty?: string;
  patientId: string;           // Para quem é a consulta
  scheduledById: string;       // Quem está agendando
  localId?: string;
  notes?: string;
}

interface FamilyAppointmentResult {
  success: boolean;
  appointmentId?: string;
  message: string;
  requiresPayment?: boolean;
  paymentUrl?: string;
}

export class FamilyAppointmentService {
  private supabase: SupabaseClient;
  private familyService: FamilyService;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.familyService = new FamilyService(supabase);
  }
  
  /**
   * Agenda consulta para um familiar
   */
  async scheduleForFamilyMember(
    params: FamilyAppointmentParams
  ): Promise<FamilyAppointmentResult> {
    // 1. Verificar permissão
    const permission = await this.familyService.checkPermission(
      params.scheduledById,
      params.patientId,
      'schedule'
    );
    
    if (!permission.allowed) {
      return {
        success: false,
        message: permission.reason || 'Sem permissão para agendar.'
      };
    }
    
    // 2. Chamar função de reserva
    const { data, error } = await this.supabase.rpc('reserve_appointment_v2', {
      p_doctor_id: params.doctorId,
      p_appointment_datetime: params.appointmentDatetime,
      p_specialty: params.specialty || null,
      p_family_member_id: params.patientId !== params.scheduledById ? params.patientId : null,
      p_local_id: params.localId || null
    });
    
    if (error) {
      console.error('Erro na reserva:', error);
      return {
        success: false,
        message: error.message || 'Erro ao reservar horário.'
      };
    }
    
    const result = data?.[0];
    
    if (!result?.success) {
      return {
        success: false,
        message: result?.message || 'Falha na reserva.'
      };
    }
    
    // 3. Registrar quem agendou (para auditoria)
    if (params.patientId !== params.scheduledById) {
      await this.supabase
        .from('simple_audit_log')
        .insert({
          table_name: 'consultas',
          operation: 'FAMILY_SCHEDULE',
          user_id: params.scheduledById,
          data: {
            appointment_id: result.appointment_id,
            scheduled_for: params.patientId,
            scheduled_by: params.scheduledById,
            datetime: params.appointmentDatetime
          }
        });
    }
    
    // 4. Notificar o paciente (se for familiar e maior de idade)
    if (params.patientId !== params.scheduledById) {
      await this.notifyPatientAboutAppointment(
        params.patientId,
        params.scheduledById,
        result.appointment_id
      );
    }
    
    return {
      success: true,
      appointmentId: result.appointment_id,
      message: 'Consulta agendada com sucesso.',
      requiresPayment: true // Assumindo que consultas requerem pagamento
    };
  }
  
  /**
   * Cancela consulta de um familiar
   */
  async cancelForFamilyMember(
    appointmentId: string,
    cancelledById: string,
    patientId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. Verificar permissão
    const permission = await this.familyService.checkPermission(
      cancelledById,
      patientId,
      'cancel'
    );
    
    if (!permission.allowed) {
      return {
        success: false,
        message: permission.reason || 'Sem permissão para cancelar.'
      };
    }
    
    // 2. Cancelar consulta
    const { error } = await this.supabase
      .from('consultas')
      .update({
        status: 'cancelada',
        notes: reason ? `Cancelado por familiar: ${reason}` : 'Cancelado por familiar'
      })
      .eq('id', appointmentId)
      .or(`paciente_id.eq.${patientId},paciente_familiar_id.eq.${patientId}`);
    
    if (error) {
      return {
        success: false,
        message: error.message || 'Erro ao cancelar.'
      };
    }
    
    // 3. Registrar auditoria
    await this.supabase
      .from('simple_audit_log')
      .insert({
        table_name: 'consultas',
        operation: 'FAMILY_CANCEL',
        user_id: cancelledById,
        data: {
          appointment_id: appointmentId,
          cancelled_for: patientId,
          cancelled_by: cancelledById,
          reason
        }
      });
    
    // 4. Notificar paciente
    if (cancelledById !== patientId) {
      await this.notifyPatientAboutCancellation(
        patientId,
        cancelledById,
        appointmentId
      );
    }
    
    return {
      success: true,
      message: 'Consulta cancelada com sucesso.'
    };
  }
  
  /**
   * Busca consultas de todos os familiares
   */
  async getFamilyAppointments(userId: string): Promise<FamilyAppointmentWithPatient[]> {
    // Buscar IDs dos familiares ativos
    const { data: familyMembers } = await this.supabase
      .from('family_members')
      .select('family_member_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('can_view_history', true);
    
    const familyMemberIds = familyMembers?.map(m => m.family_member_id) || [];
    const allPatientIds = [userId, ...familyMemberIds];
    
    // Buscar consultas
    const { data, error } = await this.supabase
      .from('consultas')
      .select(`
        *,
        paciente:profiles!consultas_paciente_id_fkey(id, display_name, photo_url),
        medico:profiles!consultas_medico_id_fkey(id, display_name, photo_url)
      `)
      .in('paciente_id', allPatientIds)
      .gte('consultation_date', new Date().toISOString())
      .order('consultation_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar consultas familiares:', error);
      return [];
    }
    
    return data || [];
  }
  
  private async notifyPatientAboutAppointment(
    patientId: string,
    scheduledById: string,
    appointmentId: string
  ): Promise<void> {
    const { data: scheduler } = await this.supabase
      .from('profiles')
      .select('display_name')
      .eq('id', scheduledById)
      .single();
    
    await this.supabase
      .from('family_notifications')
      .insert({
        user_id: patientId,
        patient_id: patientId,
        notification_type: 'appointment_confirmed',
        title: 'Consulta agendada para você',
        message: `${scheduler?.display_name || 'Seu familiar'} agendou uma consulta para você.`,
        priority: 'normal',
        action_url: `/paciente/consultas/${appointmentId}`
      });
  }
  
  private async notifyPatientAboutCancellation(
    patientId: string,
    cancelledById: string,
    appointmentId: string
  ): Promise<void> {
    const { data: canceller } = await this.supabase
      .from('profiles')
      .select('display_name')
      .eq('id', cancelledById)
      .single();
    
    await this.supabase
      .from('family_notifications')
      .insert({
        user_id: patientId,
        patient_id: patientId,
        notification_type: 'appointment_cancelled',
        title: 'Consulta cancelada',
        message: `${canceller?.display_name || 'Seu familiar'} cancelou uma consulta que estava agendada para você.`,
        priority: 'high'
      });
  }
}

interface FamilyAppointmentWithPatient {
  id: number;
  consultation_date: string;
  status: string;
  consultation_type: string;
  paciente: {
    id: string;
    display_name: string;
    photo_url: string | null;
  };
  medico: {
    id: string;
    display_name: string;
    photo_url: string | null;
  };
}
```

### 4.5 Dashboard Familiar Consolidado

```typescript
// src/services/familyDashboardService.ts

interface FamilyDashboardData {
  upcomingAppointments: UpcomingAppointment[];
  pendingMedications: PendingMedication[];
  healthAlerts: HealthAlert[];
  pendingExams: PendingExam[];
  upcomingVaccinations: UpcomingVaccination[];
  notifications: FamilyNotification[];
}

interface UpcomingAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhoto: string | null;
  doctorName: string;
  specialty: string;
  dateTime: string;
  type: 'teleconsulta' | 'presencial';
  status: string;
}

interface PendingMedication {
  id: string;
  patientId: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  nextDose: string;
  frequency: string;
  isOverdue: boolean;
}

interface HealthAlert {
  id: string;
  patientId: string;
  patientName: string;
  alertType: 'exam_pending' | 'prescription_expiring' | 'vaccination_due' | 'appointment_missed';
  title: string;
  message: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  actionUrl?: string;
}

export class FamilyDashboardService {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  async getDashboardData(userId: string): Promise<FamilyDashboardData> {
    // Buscar familiares ativos
    const { data: familyMembers } = await this.supabase
      .rpc('get_family_members', { user_uuid: userId });
    
    const familyMemberIds = familyMembers?.map((m: any) => m.family_member_id) || [];
    const allPatientIds = [userId, ...familyMemberIds];
    
    // Buscar dados em paralelo
    const [
      appointments,
      medications,
      exams,
      vaccinations,
      notifications
    ] = await Promise.all([
      this.getUpcomingAppointments(allPatientIds),
      this.getPendingMedications(allPatientIds),
      this.getPendingExams(allPatientIds),
      this.getUpcomingVaccinations(allPatientIds),
      this.getNotifications(userId)
    ]);
    
    // Gerar alertas baseados nos dados
    const healthAlerts = this.generateHealthAlerts(
      appointments,
      medications,
      exams,
      vaccinations
    );
    
    return {
      upcomingAppointments: appointments,
      pendingMedications: medications,
      healthAlerts,
      pendingExams: exams,
      upcomingVaccinations: vaccinations,
      notifications
    };
  }
  
  private async getUpcomingAppointments(patientIds: string[]): Promise<UpcomingAppointment[]> {
    const { data } = await this.supabase
      .from('consultas')
      .select(`
        id,
        consultation_date,
        consultation_type,
        status,
        paciente:profiles!consultas_paciente_id_fkey(id, display_name, photo_url),
        medico:profiles!consultas_medico_id_fkey(display_name),
        paciente_familiar_id
      `)
      .in('paciente_id', patientIds)
      .gte('consultation_date', new Date().toISOString())
      .in('status', ['agendada', 'confirmada'])
      .order('consultation_date')
      .limit(10);
    
    return (data || []).map(apt => ({
      id: String(apt.id),
      patientId: apt.paciente?.id || apt.paciente_familiar_id,
      patientName: apt.paciente?.display_name || 'Desconhecido',
      patientPhoto: apt.paciente?.photo_url,
      doctorName: apt.medico?.display_name || 'Médico',
      specialty: apt.consultation_type || 'Consulta',
      dateTime: apt.consultation_date,
      type: apt.consultation_type as 'teleconsulta' | 'presencial',
      status: apt.status || 'agendada'
    }));
  }
  
  private async getPendingMedications(patientIds: string[]): Promise<PendingMedication[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await this.supabase
      .from('medication_reminders')
      .select(`
        id,
        user_id,
        medication_name,
        dosage,
        frequency,
        times,
        profiles!medication_reminders_user_id_fkey(display_name)
      `)
      .in('user_id', patientIds)
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`);
    
    return (data || []).map(med => {
      const times = med.times as string[] || [];
      const nextDose = this.calculateNextDose(times);
      
      return {
        id: med.id,
        patientId: med.user_id,
        patientName: (med as any).profiles?.display_name || 'Desconhecido',
        medicationName: med.medication_name,
        dosage: med.dosage,
        nextDose,
        frequency: med.frequency,
        isOverdue: new Date(nextDose) < new Date()
      };
    });
  }
  
  private async getPendingExams(patientIds: string[]): Promise<PendingExam[]> {
    const { data } = await this.supabase
      .from('medical_exams')
      .select(`
        id,
        patient_id,
        exam_name,
        exam_type,
        scheduled_date,
        status,
        urgent,
        profiles!medical_exams_patient_id_fkey(display_name)
      `)
      .in('patient_id', patientIds)
      .in('status', ['pending', 'scheduled'])
      .order('scheduled_date');
    
    return (data || []).map(exam => ({
      id: exam.id,
      patientId: exam.patient_id,
      patientName: (exam as any).profiles?.display_name || 'Desconhecido',
      examName: exam.exam_name,
      examType: exam.exam_type,
      scheduledDate: exam.scheduled_date,
      isUrgent: exam.urgent || false
    }));
  }
  
  private async getUpcomingVaccinations(patientIds: string[]): Promise<UpcomingVaccination[]> {
    const { data } = await this.supabase
      .from('vaccination_records')
      .select(`
        id,
        patient_id,
        vaccine_name,
        vaccine_type,
        next_dose_date,
        dose_number,
        total_doses,
        profiles!vaccination_records_patient_id_fkey(display_name)
      `)
      .in('patient_id', patientIds)
      .not('next_dose_date', 'is', null)
      .gte('next_dose_date', new Date().toISOString().split('T')[0])
      .order('next_dose_date');
    
    return (data || []).map(vac => ({
      id: vac.id,
      patientId: vac.patient_id,
      patientName: (vac as any).profiles?.display_name || 'Desconhecido',
      vaccineName: vac.vaccine_name,
      vaccineType: vac.vaccine_type,
      nextDoseDate: vac.next_dose_date || '',
      doseNumber: vac.dose_number || 1,
      totalDoses: vac.total_doses || 1
    }));
  }
  
  private async getNotifications(userId: string): Promise<FamilyNotification[]> {
    const { data } = await this.supabase
      .from('family_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20);
    
    return data || [];
  }
  
  private generateHealthAlerts(
    appointments: UpcomingAppointment[],
    medications: PendingMedication[],
    exams: PendingExam[],
    vaccinations: UpcomingVaccination[]
  ): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    
    // Alertas de medicamentos atrasados
    medications
      .filter(m => m.isOverdue)
      .forEach(m => {
        alerts.push({
          id: `med-${m.id}`,
          patientId: m.patientId,
          patientName: m.patientName,
          alertType: 'prescription_expiring',
          title: 'Medicamento atrasado',
          message: `${m.patientName} não tomou ${m.medicationName}`,
          priority: 'urgent',
          actionUrl: `/paciente/medicamentos/${m.id}`
        });
      });
    
    // Alertas de exames urgentes
    exams
      .filter(e => e.isUrgent)
      .forEach(e => {
        alerts.push({
          id: `exam-${e.id}`,
          patientId: e.patientId,
          patientName: e.patientName,
          alertType: 'exam_pending',
          title: 'Exame urgente pendente',
          message: `${e.patientName} precisa realizar: ${e.examName}`,
          priority: 'high',
          actionUrl: `/paciente/exames/${e.id}`
        });
      });
    
    // Alertas de vacinas próximas
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    vaccinations
      .filter(v => new Date(v.nextDoseDate) <= oneWeekFromNow)
      .forEach(v => {
        alerts.push({
          id: `vac-${v.id}`,
          patientId: v.patientId,
          patientName: v.patientName,
          alertType: 'vaccination_due',
          title: 'Vacina a vencer',
          message: `${v.patientName}: ${v.vaccineName} (dose ${v.doseNumber}/${v.totalDoses})`,
          priority: 'normal'
        });
      });
    
    // Ordenar por prioridade
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return alerts;
  }
  
  private calculateNextDose(times: string[]): string {
    if (!times.length) return new Date().toISOString();
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const time of times.sort()) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      if (timeInMinutes > currentTime) {
        const nextDose = new Date();
        nextDose.setHours(hours, minutes, 0, 0);
        return nextDose.toISOString();
      }
    }
    
    // Próxima dose é amanhã no primeiro horário
    const [hours, minutes] = times[0].split(':').map(Number);
    const nextDose = new Date();
    nextDose.setDate(nextDose.getDate() + 1);
    nextDose.setHours(hours, minutes, 0, 0);
    return nextDose.toISOString();
  }
}

interface PendingExam {
  id: string;
  patientId: string;
  patientName: string;
  examName: string;
  examType: string;
  scheduledDate: string | null;
  isUrgent: boolean;
}

interface UpcomingVaccination {
  id: string;
  patientId: string;
  patientName: string;
  vaccineName: string;
  vaccineType: string;
  nextDoseDate: string;
  doseNumber: number;
  totalDoses: number;
}

interface FamilyNotification {
  id: string;
  user_id: string;
  patient_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  action_required: boolean;
  action_url: string | null;
  read: boolean;
  created_at: string;
}
```

---

## 5. REIVINDICAÇÕES

### Reivindicação 1 (Independente - Sistema)

Um sistema computadorizado para gestão delegada de saúde familiar, caracterizado por compreender:

a) um módulo de vínculos familiares configurado para registrar e validar relacionamentos entre usuários, com estados de pendente, ativo, suspenso e revogado;

b) um módulo de permissões granulares configurado para definir capacidades específicas por familiar, incluindo agendar, cancelar, visualizar histórico, visualizar prescrições, visualizar exames e gerenciar medicamentos;

c) um módulo de agendamento delegado configurado para permitir que usuário autorizados agendem e cancelem consultas em nome de familiares, com verificação de permissões e registro de auditoria;

d) um módulo de dashboard consolidado configurado para apresentar visão unificada de consultas, medicamentos, exames e vacinas de todos os familiares vinculados;

e) um módulo de notificações configurado para agregar alertas de múltiplos familiares e enviá-los ao cuidador principal.

### Reivindicação 2 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que o módulo de vínculos requer confirmação do familiar antes de ativar o vínculo.

### Reivindicação 3 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que o módulo de permissões suporta três níveis hierárquicos: admin (controle total), edit (agendar e cancelar) e view (apenas visualizar).

### Reivindicação 4 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que o módulo de auditoria registra todas as ações realizadas em nome de familiares, incluindo identificação de quem realizou a ação.

### Reivindicação 5 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que o módulo de notificações gera alertas automáticos para medicamentos atrasados, exames pendentes e vacinas a vencer.

### Reivindicação 6 (Independente - Método)

Método computadorizado para agendamento delegado de consultas médicas, caracterizado por compreender as etapas de:

a) receber solicitação de agendamento identificando o solicitante e o paciente beneficiário;

b) verificar existência de vínculo ativo entre solicitante e paciente;

c) verificar se o solicitante possui permissão específica para agendar (can_schedule = true);

d) se autorizado, executar o agendamento registrando tanto o paciente quanto quem agendou;

e) notificar o paciente sobre o agendamento realizado em seu nome;

f) registrar a ação em log de auditoria para rastreabilidade.

### Reivindicação 7 (Dependente)

Método de acordo com a reivindicação 6, caracterizado pelo fato de que a revogação de vínculo pode ser realizada tanto pelo cuidador quanto pelo dependente.

---

## 6. VANTAGENS DA INVENÇÃO

1. **Gestão Centralizada**: Cuidadores podem gerenciar saúde de toda a família em um único lugar
2. **Controle Granular**: Permissões específicas garantem privacidade e controle adequado
3. **Rastreabilidade**: Auditoria completa de quem realizou cada ação
4. **Notificações Consolidadas**: Cuidador recebe alertas de todos os familiares
5. **Consentimento**: Dependentes precisam aceitar o vínculo (para adultos)
6. **Flexibilidade**: Suporta diversos tipos de relacionamento e níveis de acesso

---

## 7. APLICAÇÕES INDUSTRIAIS

- Gestão de saúde de filhos menores de idade
- Acompanhamento de pais idosos
- Cuidadores profissionais de múltiplos pacientes
- Famílias com membros com necessidades especiais
- Planos de saúde familiares

---

## 8. REFERÊNCIAS AO CÓDIGO-FONTE

- `src/services/familyService.ts` - Gerenciamento de vínculos
- `src/services/familyAppointmentService.ts` - Agendamento delegado
- `src/services/familyDashboardService.ts` - Dashboard consolidado
- `src/hooks/useFamilyManagement.ts` - Hook React para gestão familiar
- Tabelas: `family_members`, `family_notifications`
- RPC: `get_family_members`, `get_family_upcoming_activities`

---

*Documento preparado para fins de depósito de patente. Todos os algoritmos e implementações são propriedade intelectual original.*
