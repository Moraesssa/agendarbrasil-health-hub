// Utilitário para inicializar mocks rapidamente
import { MockUtils } from '@/services/mockDataService';

// Ativar mocks automaticamente em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // Verificar se existe flag para ativar mocks
  const urlParams = new URLSearchParams(window.location.search);
  const enableMocks = urlParams.has('mocks') || localStorage.getItem('enableMocks') === 'true';
  
  if (enableMocks) {
    MockUtils.enable();
    console.log('🎭 Mocks ativados automaticamente');
    
    // Salvar preferência
    localStorage.setItem('enableMocks', 'true');
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