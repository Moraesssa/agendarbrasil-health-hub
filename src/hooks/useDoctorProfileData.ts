// Legacy - Replaced by agendamentoService
export const useDoctorProfileData = () => ({
  metrics: { totalConsultations: 0, todaysConsultations: 0, upcomingConsultations: 0, uniquePatients: 0, occupancyRate: 0, satisfactionRate: 0 },
  upcomingAppointments: [],
  calendarAppointments: [],
  notifications: [],
  loading: false,
  error: null,
  refetch: async () => {}
});
