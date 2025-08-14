// Arquivo de configuração e setup para testes E2E

// Importar comandos customizados
import './commands';

// Configurações globais do Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar erros específicos que não afetam os testes
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // Permitir que outros erros falhem o teste
  return true;
});

// Configurações antes de cada teste
beforeEach(() => {
  // Limpar dados de sessões anteriores
  cy.cleanTestData();
  
  // Configurar interceptadores de API se necessário
  // cy.interceptApiCalls();
  
  // Configurar viewport padrão
  cy.viewport(1280, 720);
});

// Configurações após cada teste
afterEach(() => {
  // Capturar screenshot em caso de falha
  cy.screenshot({ capture: 'runner', onlyOnFailure: true });
});

// Configurações globais de timeout
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);

// Configurações de retry para testes flaky
Cypress.config('retries', {
  runMode: 2,
  openMode: 0
});