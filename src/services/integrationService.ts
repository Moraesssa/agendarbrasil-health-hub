// Legacy - Will be replaced
export const integrationService = {
  getDataSources: async () => [],
  getUserConsents: async () => [],
  grantConsent: async (data: any) => ({} as any),
  revokeConsent: async (id: string) => {},
  getIntegrationLogs: async (id?: string) => []
};
