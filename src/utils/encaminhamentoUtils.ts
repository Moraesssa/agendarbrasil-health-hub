export const getStatusColor = (status: string) => {
  switch (status) {
    case 'aceito':
    case 'confirmado':
      return 'bg-green-100 text-green-700';
    case 'aguardando':
    case 'pendente':
      return 'bg-orange-100 text-orange-700';
    case 'rejeitado':
      return 'bg-red-100 text-red-700';
    case 'realizado':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'aguardando':
      return 'Aguardando';
    case 'aceito':
      return 'Aceito';
    case 'rejeitado':
      return 'Rejeitado';
    case 'realizado':
      return 'Realizado';
    default:
      return status;
  }
};