// Utilitário para inicializar mocks rapidamente
import { MockUtils } from '@/services/mockDataService';

// Mocks DESABILITADOS por padrão - apenas para desenvolvimento explícito
if (process.env.NODE_ENV === 'development') {
  // Verificar se existe flag EXPLÍCITA para ativar mocks
  const urlParams = new URLSearchParams(window.location.search);
  const forceEnableMocks = urlParams.has('force-mocks');
  
  if (forceEnableMocks && localStorage.getItem('enableMocks') !== 'true') {
    console.log('🎭 Mocks ativados via URL para desenvolvimento');
    localStorage.setItem('enableMocks', 'true');
    window.location.reload();
  }
}

// Função global para ativar mocks via console
(window as any).enableMocks = () => {
  MockUtils.enable();
  localStorage.setItem('enableMocks', 'true');
  window.location.reload();
};

(window as any).disableMocks = () => {
  MockUtils.disable();
  localStorage.removeItem('enableMocks');
  window.location.reload();
};