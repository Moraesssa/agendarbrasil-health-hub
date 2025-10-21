// Legacy - Replaced by agendamentoService
export class RealAppointmentService {
  async getSpecialties() { return []; }
  async getDoctorsByLocationAndSpecialty() { return []; }
  async getAvailableSlotsByDoctor() { return []; }
  async createTemporaryReservation() { return { data: { id: '' }, sessionId: '', expiresAt: new Date() }; }
  async cleanupTemporaryReservation() {}
  async extendReservation() { return null; }
  async scheduleAppointment() { return {}; }
}
export default new RealAppointmentService();
