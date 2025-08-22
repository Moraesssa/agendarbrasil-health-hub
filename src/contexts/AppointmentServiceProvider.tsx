import React, { createContext, useContext, useMemo } from 'react';
import { IAppointmentService, AppointmentServiceEnvironment } from '@/types/appointmentService';
import { RealAppointmentService } from '@/services/realAppointmentService';
import { PureMockAppointmentService } from '@/services/pureUserMockService';
import { mockDataService } from '@/services/mockDataService';

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

  // In production, never use mocks regardless of localStorage
  if (import.meta.env.PROD) {
    return 'production';
  }

  // In development, check if mocks are enabled
  if (mockDataService.isEnabled()) {
    return 'mock';
  }

  // Default to development (real services but not production)
  return 'development';
}

/**
 * Creates the appropriate service instance based on environment
 */
function createAppointmentService(environment: AppointmentServiceEnvironment): IAppointmentService {
  switch (environment) {
    case 'mock':
      console.log('🎭 AppointmentServiceProvider: Using mock service');
      return new PureMockAppointmentService();
    
    case 'production':
    case 'development':
    default:
      console.log('🏥 AppointmentServiceProvider: Using real service');
      return new RealAppointmentService();
  }
}

export const AppointmentServiceProvider: React.FC<AppointmentServiceProviderProps> = ({ 
  children, 
  forceEnvironment 
}) => {
  const contextValue = useMemo(() => {
    const environment = determineEnvironment(forceEnvironment);
    const appointmentService = createAppointmentService(environment);
    const isMockEnabled = environment === 'mock';

    console.log(`🔧 AppointmentServiceProvider initialized:`, {
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