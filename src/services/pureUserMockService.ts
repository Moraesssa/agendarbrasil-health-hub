import { IAppointmentService } from '@/types/appointmentService';
import { Medico, LocalComHorarios } from '@/services/newAppointmentService';
import { mockDataService } from '@/services/mockDataService';
import { logger } from '@/utils/logger';

/**
 * Pure mock implementation of appointment service
 * Contains no production logic - only simulation data and delays
 */
export class PureMockAppointmentService implements IAppointmentService {
  private async simulateNetworkDelay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async getSpecialties(): Promise<string[]> {
    logger.info("Mock: Fetching specialties", "PureMockAppointmentService");
    await this.simulateNetworkDelay(500);
    return mockDataService.getSpecialties();
  }

  async getDoctorsByLocationAndSpecialty(
    specialty: string, 
    city: string, 
    state: string
  ): Promise<Medico[]> {
    logger.info("Mock: Fetching doctors by location and specialty", "PureMockAppointmentService");
    await this.simulateNetworkDelay(800);
    
    // Generate mock doctors based on location
    const mockDoctors: Medico[] = [
      { id: 'doc-001', display_name: `Dr. João Silva (${specialty})` },
      { id: 'doc-002', display_name: `Dra. Maria Santos (${specialty})` },
      { id: 'doc-003', display_name: `Dr. Pedro Oliveira (${specialty})` }
    ].filter((_, index) => {
      // Simulate availability based on location hash
      const hash = (city + state + specialty).length;
      return hash % 4 >= index; // Variation in number of doctors
    });
    
    console.log(`🎭 Mock: Found ${mockDoctors.length} doctors for ${specialty} in ${city}, ${state}`);
    return mockDoctors;
  }

  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    logger.info("Mock: Fetching available slots by doctor", "PureMockAppointmentService");
    await this.simulateNetworkDelay(600);
    return mockDataService.getAvailableSlotsByDoctor(doctorId, date);
  }

  async createTemporaryReservation(
    doctorId: string, 
    dateTime: string, 
    localId?: string
  ): Promise<{ data: { id: string }; sessionId: string; expiresAt: Date }> {
    logger.info("Mock: Creating temporary reservation", "PureMockAppointmentService");
    await this.simulateNetworkDelay(200);
    
    return {
      data: { id: 'mock-res-id' },
      sessionId: `temp_mock_${Date.now()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
  }

  async cleanupTemporaryReservation(sessionId: string): Promise<void> {
    logger.info(`Mock: Cleaning up reservation ${sessionId}`, "PureMockAppointmentService");
    await this.simulateNetworkDelay(100);
  }

  async extendReservation(sessionId: string): Promise<{ expiresAt: Date } | null> {
    logger.info(`Mock: Extending reservation ${sessionId}`, "PureMockAppointmentService");
    await this.simulateNetworkDelay(100);
    return { expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
  }

  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    consultation_date: string;
    consultation_type: string;
    local_consulta_texto: string;
    local_id?: string;
  }): Promise<any> {
    logger.info("Mock: Scheduling appointment", "PureMockAppointmentService");
    await this.simulateNetworkDelay(1200);
    return mockDataService.scheduleAppointment(appointmentData);
  }
}