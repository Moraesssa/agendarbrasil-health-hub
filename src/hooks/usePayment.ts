// Legacy - Will be replaced
export const usePayment = () => ({ 
  processing: false, 
  processPayment: async (data: any) => ({ success: false }),
  checkPendingPayments: async (id?: string) => [],
  verifyPayment: async (id: string) => ({ verified: false, success: false, paid: false }),
  createCustomerPortalSession: async () => ({ url: '' })
});
