import { supabase } from '@/integrations/supabase/client';
import { ExternalDataSource, UserConsent, IntegrationLog, ConsentRequest } from '@/types/integrations';
import { logger } from '@/utils/logger';

export const integrationService = {
  async getDataSources(): Promise<ExternalDataSource[]> {
    try {
      const { data, error } = await supabase
        .from('external_data_sources')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Erro ao buscar fontes de dados: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Falha ao buscar fontes de dados", "IntegrationService", error);
      throw error;
    }
  },

  async getUserConsents(): Promise<UserConsent[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar consentimentos: ${error.message}`);
      }

      return (data || []) as UserConsent[];
    } catch (error) {
      logger.error("Falha ao buscar consentimentos", "IntegrationService", error);
      throw error;
    }
  },

  async grantConsent(request: ConsentRequest): Promise<UserConsent> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // First, revoke any existing consent for this source
      await supabase
        .from('user_consents')
        .update({ 
          status: 'revoked', 
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', user.id)
        .eq('source_id', request.source_id);

      // Create new consent
      const { data, error } = await supabase
        .from('user_consents')
        .insert({
          patient_id: user.id,
          source_id: request.source_id,
          status: 'granted',
          consent_version: request.consent_version,
          ip_address: request.ip_address,
          user_agent: request.user_agent
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao conceder consentimento: ${error.message}`);
      }

      // Log the consent action
      await this.logIntegrationAction(request.source_id, 'consent_granted', 'success', {
        consent_version: request.consent_version
      });

      return data as UserConsent;
    } catch (error) {
      logger.error("Falha ao conceder consentimento", "IntegrationService", error);
      throw error;
    }
  },

  async revokeConsent(sourceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('user_consents')
        .update({ 
          status: 'revoked', 
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', user.id)
        .eq('source_id', sourceId)
        .eq('status', 'granted');

      if (error) {
        throw new Error(`Erro ao revogar consentimento: ${error.message}`);
      }

      // Log the revocation action
      await this.logIntegrationAction(sourceId, 'consent_revoked', 'success');
    } catch (error) {
      logger.error("Falha ao revogar consentimento", "IntegrationService", error);
      throw error;
    }
  },

  async getIntegrationLogs(): Promise<IntegrationLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('integration_logs')
        .select(`
          *,
          external_data_sources(name)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Erro ao buscar logs: ${error.message}`);
      }

      return (data || []) as IntegrationLog[];
    } catch (error) {
      logger.error("Falha ao buscar logs de integração", "IntegrationService", error);
      throw error;
    }
  },

  async logIntegrationAction(
    sourceId: string, 
    action: string, 
    status: 'success' | 'failed' | 'rejected',
    payload?: any,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('integration_logs')
        .insert({
          source_id: sourceId,
          patient_id: user?.id,
          action,
          status,
          payload,
          error_message: errorMessage
        });
    } catch (error) {
      logger.error("Falha ao registrar log de integração", "IntegrationService", error);
      // Don't throw here to avoid breaking the main flow
    }
  },

  async getConsentStatus(sourceId: string): Promise<UserConsent | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('patient_id', user.id)
        .eq('source_id', sourceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Erro ao verificar consentimento: ${error.message}`);
      }

      return (data || null) as UserConsent | null;
    } catch (error) {
      logger.error("Falha ao verificar status de consentimento", "IntegrationService", error);
      throw error;
    }
  }
};