import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface SystemHealth {
  component: string;
  status: string;
  details: any;
  checked_at: string;
}

interface SystemStatus {
  healthy: boolean;
  components: SystemHealth[];
  lastCheck: Date;
}

export const useSystemMonitoring = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkSystemHealth = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      logger.debug('Verificando saúde do sistema', 'useSystemMonitoring');
      
      const { data, error } = await supabase.rpc('system_health_check');
      
      if (error) {
        logger.error('Erro ao verificar sistema', 'useSystemMonitoring', error);
        toast({
          title: "Erro de monitoramento",
          description: "Não foi possível verificar o status do sistema",
          variant: "destructive"
        });
        return;
      }

      const isHealthy = data?.every((component: SystemHealth) => 
        component.status === 'healthy'
      ) ?? false;

      setSystemStatus({
        healthy: isHealthy,
        components: data || [],
        lastCheck: new Date()
      });

      logger.info('Status do sistema atualizado', 'useSystemMonitoring', { isHealthy, components: data?.length });
      
    } catch (error) {
      logger.error('Erro inesperado ao verificar sistema', 'useSystemMonitoring', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Verificação automática a cada 5 minutos
  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    systemStatus,
    isChecking,
    checkSystemHealth,
    isSystemHealthy: systemStatus?.healthy ?? true
  };
};