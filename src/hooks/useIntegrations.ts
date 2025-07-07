import { useState, useEffect } from 'react';
import { ExternalDataSource, UserConsent, IntegrationLog } from '@/types/integrations';
import { integrationService } from '@/services/integrationService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

export const useIntegrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dataSources, setDataSources] = useState<ExternalDataSource[]>([]);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDataSources = async () => {
    try {
      const data = await integrationService.getDataSources();
      setDataSources(data);
    } catch (error) {
      logger.error("Error loading data sources", "useIntegrations", error);
      toast({
        title: "Erro ao carregar fontes de dados",
        description: "Não foi possível carregar as fontes de dados disponíveis",
        variant: "destructive",
      });
    }
  };

  const loadConsents = async () => {
    if (!user) return;
    
    try {
      const data = await integrationService.getUserConsents();
      setConsents(data);
    } catch (error) {
      logger.error("Error loading consents", "useIntegrations", error);
      toast({
        title: "Erro ao carregar consentimentos",
        description: "Não foi possível carregar seus consentimentos",
        variant: "destructive",
      });
    }
  };

  const loadLogs = async () => {
    if (!user) return;
    
    try {
      const data = await integrationService.getIntegrationLogs();
      setLogs(data);
    } catch (error) {
      logger.error("Error loading integration logs", "useIntegrations", error);
      // Don't show toast for logs error as it's not critical
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDataSources(),
        loadConsents(),
        loadLogs()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const grantConsent = async (sourceId: string): Promise<boolean> => {
    try {
      setActionLoading(sourceId);
      
      // Get client IP and user agent for audit
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      
      await integrationService.grantConsent({
        source_id: sourceId,
        consent_version: '1.0',
        ip_address: ip,
        user_agent: navigator.userAgent
      });

      await loadConsents();
      await loadLogs();

      const source = dataSources.find(s => s.id === sourceId);
      toast({
        title: "Consentimento concedido",
        description: `Você autorizou a integração com ${source?.name}`,
      });

      return true;
    } catch (error) {
      logger.error("Error granting consent", "useIntegrations", error);
      toast({
        title: "Erro ao conceder consentimento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const revokeConsent = async (sourceId: string): Promise<boolean> => {
    try {
      setActionLoading(sourceId);
      
      await integrationService.revokeConsent(sourceId);
      await loadConsents();
      await loadLogs();

      const source = dataSources.find(s => s.id === sourceId);
      toast({
        title: "Consentimento revogado",
        description: `A integração com ${source?.name} foi desabilitada`,
      });

      return true;
    } catch (error) {
      logger.error("Error revoking consent", "useIntegrations", error);
      toast({
        title: "Erro ao revogar consentimento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const getConsentStatus = (sourceId: string): UserConsent | null => {
    return consents.find(c => c.source_id === sourceId && c.status === 'granted') || null;
  };

  const hasActiveConsent = (sourceId: string): boolean => {
    return !!getConsentStatus(sourceId);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  return {
    dataSources,
    consents,
    logs,
    loading,
    actionLoading,
    grantConsent,
    revokeConsent,
    getConsentStatus,
    hasActiveConsent,
    refetch: loadAll
  };
};