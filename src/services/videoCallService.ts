// Legacy stub
export const videoCallService = {
  async createOrUpdateVideoRoom(consultaId: string) {
    return { success: false, error: 'Legacy service' };
  },
  async getVideoRoom(consultaId: string) {
    return { success: false, error: 'Legacy service' };
  },
  async convertToVideoConsultation(consultaId: string) {
    return { success: false, error: 'Legacy service' };
  },
  async canAccessVideoRoom(consultaId: string, userId: string) {
    return { success: false, canAccess: false, error: 'Legacy service' };
  },
  async getUserVideoConsultations(userId: string) {
    return { success: false, consultations: [], error: 'Legacy service' };
  }
};
