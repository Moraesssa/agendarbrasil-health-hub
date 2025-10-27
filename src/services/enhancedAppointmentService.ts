export const enhancedAppointmentService = {
  rescheduleAppointment: async (appointmentId: string, newDateTime: string) => ({
    success: false,
    error: 'Recurso não disponível - use o novo sistema de agendamento'
  }),
  addToWaitingList: async (
    patientId: string,
    doctorId: string,
    specialty: string,
    preferredDate: string
  ) => ({
    success: false,
    error: 'Recurso não disponível'
  }),
  getWaitingListPosition: async (patientId: string, doctorId: string) => null
};
