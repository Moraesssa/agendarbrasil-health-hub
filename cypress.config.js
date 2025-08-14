import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // URL base da aplicação
    baseUrl: 'http://localhost:8080',
    
    // Configurações de viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Configurações de teste
    testIsolation: true,
    
    // Configurações de vídeo e screenshots
    video: true,
    screenshotOnRunFailure: true,
    
    // Pasta de testes
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    
    // Configurações de suporte
    supportFile: 'cypress/support/e2e.js',
    
    setupNodeEvents(on, config) {
      // Implementar listeners de eventos do Node aqui
      
      // Configuração para diferentes ambientes
      if (config.env.environment === 'staging') {
        config.baseUrl = 'https://staging.agendarbrasil.com.br';
      } else if (config.env.environment === 'production') {
        config.baseUrl = 'https://agendarbrasil.com.br';
      }
      
      return config;
    },
  },
  
  // Configurações de componentes (caso necessário)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
  
  // Variáveis de ambiente
  env: {
    // Dados de teste
    testPatient: {
      name: 'João Silva Santos',
      email: 'joao.silva@email.com',
      phone: '(11) 99999-9999'
    }
  }
});