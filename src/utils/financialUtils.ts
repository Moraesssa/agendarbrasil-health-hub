export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'succeeded': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'succeeded': return 'Pago';
    case 'pending': return 'Pendente';
    case 'failed': return 'Falhou';
    default: return status;
  }
};