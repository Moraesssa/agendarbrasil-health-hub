import { mockDataService } from '@/services/mockDataService';
import { Medico, LocalComHorarios } from '@/services/newAppointmentService';
import { logger } from '@/utils/logger';

// Service que sobrescreve newAppointmentService quando mocks estão ativos
export const mockAppointmentService = {
  async getSpecialties(): Promise<string[]> {
    if (!mockDataService.isEnabled()) {
      throw new Error('Mock service not enabled');
    }
    
    logger.info("Mock: Fetching specialties", "MockAppointmentService");
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockDataService.getSpecialties();
  },

  async getDoctorsByLocationAndSpecialty(specialty: string, city: string, state: string): Promise<Medico[]> {
    if (!mockDataService.isEnabled()) {
      throw new Error('Mock service not enabled');
    }
    
    logger.info("Mock: Fetching doctors by location and specialty", "MockAppointmentService");
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar médicos mock baseados na localização
    const mockDoctors: Medico[] = [
      { id: 'doc-001', display_name: `Dr. João Silva (${specialty})` },
      { id: 'doc-002', display_name: `Dra. Maria Santos (${specialty})` },
      { id: 'doc-003', display_name: `Dr. Pedro Oliveira (${specialty})` }
    ].filter((_, index) => {
      // Simular disponibilidade baseada em hash da cidade/estado
      const hash = (city + state + specialty).length;
      return hash % 4 >= index; // Variação na quantidade de médicos
    });
    
    console.log(`🎭 Mock: Found ${mockDoctors.length} doctors for ${specialty} in ${city}, ${state}`);
    
    return mockDoctors;
  },

  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    if (!mockDataService.isEnabled()) {
      throw new Error('Mock service not enabled');
    }
    
    logger.info("Mock: Fetching available slots by doctor", "MockAppointmentService");
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return mockDataService.getAvailableSlotsByDoctor(doctorId, date);
  },

  async createTemporaryReservation(doctorId: string, dateTime: string, localId?: string): Promise<any> {
    logger.info("Mock: Creating temporary reservation", "MockAppointmentService");
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      data: { id: 'mock-res-id' },
      sessionId: `temp_mock_${Date.now()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
  },

  async cleanupTemporaryReservation(sessionId: string): Promise<void> {
    logger.info(`Mock: Cleaning up reservation ${sessionId}`, "MockAppointmentService");
    await new Promise(resolve => setTimeout(resolve, 100));
    return;
  },

  async extendReservation(sessionId: string): Promise<{ expiresAt: Date } | null> {
    logger.info(`Mock: Extending reservation ${sessionId}`, "MockAppointmentService");
    await new Promise(resolve => setTimeout(resolve, 100));
    return { expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
  },

  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    consultation_date: string;
    consultation_type: string;
    local_consulta_texto: string;
  }) {
    if (!mockDataService.isEnabled()) {
      throw new Error('Mock service not enabled');
    }
    
    logger.info("Mock: Scheduling appointment", "MockAppointmentService");
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return mockDataService.scheduleAppointment(appointmentData);
  }
};

// Função para verificar se deve usar mock service
export const shouldUseMockService = (): boolean => {
  return mockDataService.isEnabled();
};

// Proxy service que decide entre real e mock - PRODUÇÃO POR PADRÃO
export const appointmentServiceProxy = {
  async getSpecialties(): Promise<string[]> {
    // Usar serviço real por padrão, mock apenas se explicitamente habilitado
    if (shouldUseMockService()) {
      return mockAppointmentService.getSpecialties();
    }
    
    // Serviço real (produção)
    const { newAppointmentService } = await import('@/services/newAppointmentService');
    return newAppointmentService.getSpecialties();
  },

  async getDoctorsByLocationAndSpecialty(specialty: string, city: string, state: string): Promise<Medico[]> {
    if (shouldUseMockService()) {
      return mockAppointmentService.getDoctorsByLocationAndSpecialty(specialty, city, state);
    }
    
    const { newAppointmentService } = await import('@/services/newAppointmentService');
    return newAppointmentService.getDoctorsByLocationAndSpecialty(specialty, city, state);
  },

  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    if (shouldUseMockService()) {
      return mockAppointmentService.getAvailableSlotsByDoctor(doctorId, date);
    }
    
    const { newAppointmentService } = await import('@/services/newAppointmentService');
    return newAppointmentService.getAvailableSlotsByDoctor(doctorId, date);
  },

  async scheduleAppointment(appointmentData: any) {
    if (shouldUseMockService()) {
      return mockAppointmentService.scheduleAppointment(appointmentData);
    }
    
    const { newAppointmentService } = await import('@/services/newAppointmentService');
    return newAppointmentService.scheduleAppointment(appointmentData);
  },

  async createTemporaryReservation(doctorId: string, dateTime: string, localId?: string): Promise<any> {
    if (shouldUseMockService()) {
      return mockAppointmentService.createTemporaryReservation(doctorId, dateTime, localId);
    }

    const { newAppointmentService } = await import('@/services/newAppointmentService');
    return newAppointmentService.createTemporaryReservation(doctorId, dateTime, localId);
  },

  async cleanupTemporaryReservation(sessionId: string): Promise<void> {
    if (shouldUseMockService()) {
      return mockAppointmentService.cleanupTemporaryReservation(sessionId);
    }
    const { newAppointmentService } = await import('@/services/newAppointmentService');
    return newAppointmentService.cleanupTemporaryReservation(sessionId);
  },

  async extendReservation(sessionId: string): Promise<{ expiresAt: Date } | null> {
    if (shouldUseMockService()) {
      return mockAppointmentService.extendReservation(sessionId);
    }
    const { newAppointmentService } = await import('@/services/newAppointmentService');
    return newAppointmentService.extendReservation(sessionId);
  }
};