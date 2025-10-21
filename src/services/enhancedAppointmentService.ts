// Legacy - Replaced by agendamentoService
export class EnhancedAppointmentService {
  async rescheduleAppointment(id: string, newDate: string) { return { success: false, error: '' }; }
  async addToWaitingList(medico: string, data: string, periodo: string, specialty: string) { return { success: false, error: '' }; }
  async getWaitingListPosition(id: string) { return null; }
}
export const enhancedAppointmentService = new EnhancedAppointmentService();
export default enhancedAppointmentService;
