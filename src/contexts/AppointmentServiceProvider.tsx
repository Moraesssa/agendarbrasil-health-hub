import React, { createContext, useContext, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { IAppointmentService, AppointmentServiceEnvironment } from '@/types/appointmentService';
import { agendamentoService } from '@/services/agendamento';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentServiceContextValue {
  appointmentService: IAppointmentService;
  environment: AppointmentServiceEnvironment;
  isMockEnabled: boolean;
}

const AppointmentServiceContext = createContext<AppointmentServiceContextValue | undefined>(undefined);

interface AppointmentServiceProviderProps {
  children: React.ReactNode;
  forceEnvironment?: AppointmentServiceEnvironment;
}

/**
 * Determines which service environment to use based on current conditions
 */
function determineEnvironment(forceEnvironment?: AppointmentServiceEnvironment): AppointmentServiceEnvironment {
  // If forcing an environment (useful for testing), use that
  if (forceEnvironment) {
    return forceEnvironment;
  }

  // Always use real services in production mode
  return import.meta.env.PROD ? 'production' : 'development';
}

/**
 * Creates the appropriate service instance based on environment
 * Returns a compatible service wrapper
 */
function createAppointmentService(environment: AppointmentServiceEnvironment): IAppointmentService {
  logger.debug(`🏥 AppointmentServiceProvider: using agendamentoService (env=${environment})`);
  
  // Return a compatible wrapper
  return {
    getSpecialties: async () => {
      const { data } = await supabase.rpc('get_specialties');
      return data || [];
    },
    getDoctorsByLocationAndSpecialty: async (specialty: string, city: string, state: string) => {
      return agendamentoService.buscarMedicos(specialty, state, city) as any;
    },
    getAvailableSlotsByDoctor: async (doctorId: string, date: string) => {
      const locais = await agendamentoService.buscarHorarios(doctorId, date);
      return locais.map(local => ({
        ...local,
        id: local.id.toString(),
        horarios: local.horarios_disponiveis
      })) as any;
    },
    createTemporaryReservation: async () => {
      throw new Error('Not implemented');
    },
    cleanupTemporaryReservation: async () => {},
    extendReservation: async () => null,
    scheduleAppointment: async (appointmentData: any) => {
      return agendamentoService.criarConsulta(appointmentData);
    }
  } as IAppointmentService;
}

export const AppointmentServiceProvider: React.FC<AppointmentServiceProviderProps> = ({ 
  children, 
  forceEnvironment 
}) => {
  const contextValue = useMemo(() => {
    const environment = determineEnvironment(forceEnvironment);
    const appointmentService = createAppointmentService(environment);
    const isMockEnabled = false; // Mocks removidos — sempre false

    logger.info('AppointmentServiceProvider initialized', 'AppointmentServiceProvider', {
      environment,
      isMockEnabled,
      isProduction: import.meta.env.PROD
    });

    return {
      appointmentService,
      environment,
      isMockEnabled
    };
  }, [forceEnvironment]);

  return (
    <AppointmentServiceContext.Provider value={contextValue}>
      {children}
    </AppointmentServiceContext.Provider>
  );
};

/**
 * Hook to access the appointment service
 */
export const useAppointmentService = (): AppointmentServiceContextValue => {
  const context = useContext(AppointmentServiceContext);
  if (context === undefined) {
    throw new Error('useAppointmentService must be used within an AppointmentServiceProvider');
  }
  return context;
};

/**
 * Hook to access just the service instance (for backward compatibility)
 */
export const useAppointmentServiceInstance = (): IAppointmentService => {
  const { appointmentService } = useAppointmentService();
  return appointmentService;
};