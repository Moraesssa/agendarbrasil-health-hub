// Comandos customizados para os testes do AgendarBrasil Health Hub

/**
 * Comando para selecionar uma especialidade
 * @param {string} specialty - Nome da especialidade
 */
Cypress.Commands.add('selectSpecialty', (specialty) => {
  cy.get('[data-testid="specialty-select"]').click();
  cy.contains('[role="option"]', specialty).click();
});

/**
 * Comando para selecionar um estado
 * @param {string} state - Sigla do estado (ex: 'SP')
 */
Cypress.Commands.add('selectState', (state) => {
  cy.get('[data-testid="state-select"]').click();
  cy.contains('[role="option"]', state).click();
});

/**
 * Comando para selecionar uma cidade
 * @param {string} city - Nome da cidade
 */
Cypress.Commands.add('selectCity', (city) => {
  cy.get('[data-testid="city-select"]').click();
  cy.contains('[role="option"]', city).click();
});

/**
 * Comando para clicar no botão de busca
 */
Cypress.Commands.add('clickSearch', () => {
  cy.get('[data-testid="search-button"]').click();
});

/**
 * Comando para selecionar um médico pelo índice
 * @param {number} index - Índice do médico na lista (0-based)
 */
Cypress.Commands.add('selectDoctor', (index = 0) => {
  cy.get('[data-testid="doctor-card"]')
    .eq(index)
    .find('[data-testid="select-doctor-button"]')
    .click();
});

/**
 * Comando para selecionar um horário pelo índice
 * @param {number} index - Índice do horário (0-based)
 */
Cypress.Commands.add('selectTimeSlot', (index = 0) => {
  cy.get('[data-testid="time-slot"]')
    .eq(index)
    .click();
});

/**
 * Comando para preencher dados do paciente
 * @param {Object} patientData - Dados do paciente
 */
Cypress.Commands.add('fillPatientData', (patientData = {}) => {
  const defaultData = {
    fullName: 'João Silva Santos',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    ...patientData
  };
  
  if (defaultData.fullName) {
    cy.get('[data-testid="patient-name-input"]')
      .clear()
      .type(defaultData.fullName);
  }
  
  if (defaultData.email) {
    cy.get('[data-testid="patient-email-input"]')
      .clear()
      .type(defaultData.email);
  }
  
  if (defaultData.phone) {
    cy.get('[data-testid="patient-phone-input"]')
      .clear()
      .type(defaultData.phone);
  }
});

/**
 * Comando para aguardar carregamento
 * @param {string} selector - Seletor do elemento de loading
 */
Cypress.Commands.add('waitForLoading', (selector = '[data-testid="loading-spinner"]') => {
  cy.get(selector, { timeout: 15000 }).should('not.exist');
});

/**
 * Comando para verificar informações de um card de médico
 */
Cypress.Commands.add('verifyDoctorCard', () => {
  cy.get('[data-testid="doctor-name"]')
    .should('be.visible')
    .and('not.be.empty');
  
  cy.get('[data-testid="doctor-specialty"]')
    .should('be.visible')
    .and('not.be.empty');
});

/**
 * Comando para verificar mensagem de sucesso
 */
Cypress.Commands.add('verifySuccessMessage', () => {
  cy.get('[data-testid="success-message"]')
    .should('be.visible')
    .and('contain.text', 'Sucesso');
  
  cy.get('[data-testid="appointment-details"]')
    .should('be.visible');
});

/**
 * Comando para limpar dados de teste
 */
Cypress.Commands.add('cleanTestData', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearSessionStorage();
});

/**
 * Comando para interceptar chamadas da API do Supabase
 */
Cypress.Commands.add('interceptSupabaseApi', () => {
  // Interceptar especialidades
  cy.intercept('POST', '**/rest/v1/rpc/get_specialties', {
    statusCode: 200,
    body: ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Pediatria', 'Neurologia']
  }).as('getSpecialties');

  // Interceptar estados
  cy.intercept('POST', '**/rest/v1/rpc/get_available_states', {
    statusCode: 200,
    body: [
      { uf: 'SP', nome: 'São Paulo' },
      { uf: 'RJ', nome: 'Rio de Janeiro' },
      { uf: 'MG', nome: 'Minas Gerais' }
    ]
  }).as('getStates');

  // Interceptar cidades
  cy.intercept('POST', '**/rest/v1/rpc/get_available_cities', {
    statusCode: 200,
    body: [
      { cidade: 'São Paulo', estado: 'SP', total_medicos: 15 },
      { cidade: 'Campinas', estado: 'SP', total_medicos: 8 }
    ]
  }).as('getCities');

  // Interceptar médicos
  cy.intercept('GET', '**/rest/v1/medicos*', {
    statusCode: 200,
    body: [
      {
        id: 1,
        user_id: 'mock-doctor-uuid-1',
        display_name: 'Dr. Carlos Oliveira',
        crm: '123456-SP',
        especialidades: ['Cardiologia'],
        rating: 4.8,
        total_avaliacoes: 120,
        valor_consulta_presencial: 250,
        aceita_teleconsulta: true,
        foto_perfil_url: null
      },
      {
        id: 2,
        user_id: 'mock-doctor-uuid-2',
        display_name: 'Dra. Ana Maria Costa',
        crm: '789012-SP',
        especialidades: ['Cardiologia', 'Clínica Médica'],
        rating: 4.9,
        total_avaliacoes: 85,
        valor_consulta_presencial: 300,
        aceita_teleconsulta: false,
        foto_perfil_url: null
      }
    ]
  }).as('getMedicos');

  // Interceptar horários disponíveis
  cy.intercept('POST', '**/rest/v1/rpc/get_available_time_slots', {
    statusCode: 200,
    body: {
      slots: [
        { time: '08:00', available: true },
        { time: '09:00', available: true },
        { time: '10:00', available: false },
        { time: '11:00', available: true },
        { time: '14:00', available: true },
        { time: '15:00', available: true }
      ]
    }
  }).as('getTimeSlots');
});

/**
 * Comando para verificar acessibilidade básica
 */
Cypress.Commands.add('checkBasicAccessibility', () => {
  // Verificar se inputs têm labels apropriados
  cy.get('input').each(($input) => {
    cy.wrap($input).should('have.attr', 'aria-label')
      .or('have.attr', 'placeholder')
      .or('have.attr', 'title');
  });
  
  // Verificar se botões têm texto ou aria-label
  cy.get('button').each(($button) => {
    cy.wrap($button).should(($btn) => {
      const hasText = $btn.text().trim().length > 0;
      const hasAriaLabel = $btn.attr('aria-label');
      const hasTitle = $btn.attr('title');
      
      expect(hasText || hasAriaLabel || hasTitle).to.be.true;
    });
  });
});

/**
 * Comando para aguardar elemento aparecer com retry
 */
Cypress.Commands.add('waitForElement', (selector, options = {}) => {
  const defaultOptions = {
    timeout: 10000,
    ...options
  };
  
  cy.get(selector, { timeout: defaultOptions.timeout })
    .should('be.visible');
});

/**
 * Comando para fazer fluxo completo de agendamento (mock)
 */
Cypress.Commands.add('completeSchedulingFlow', (options = {}) => {
  const {
    specialty = 'Cardiologia',
    state = 'São Paulo',
    city = 'São Paulo',
    doctorIndex = 0,
    timeSlotIndex = 0
  } = options;

  // Interceptar APIs
  cy.interceptSupabaseApi();

  // Ir para página de agendamento
  cy.visit('/agendamento');

  // Selecionar filtros
  cy.selectSpecialty(specialty);
  cy.selectState(state);
  cy.wait('@getCities');
  cy.selectCity(city);

  // Buscar médicos
  cy.clickSearch();
  cy.wait('@getMedicos');

  // Selecionar médico
  cy.selectDoctor(doctorIndex);

  // Selecionar horário
  cy.wait('@getTimeSlots');
  cy.selectTimeSlot(timeSlotIndex);
});

/**
 * Comando para simular login (quando necessário para testes)
 */
Cypress.Commands.add('mockAuth', (userData = {}) => {
  const defaultUser = {
    id: 'mock-user-uuid',
    email: 'paciente@teste.com',
    user_metadata: {
      display_name: 'Paciente Teste'
    },
    ...userData
  };

  // Simular sessão no localStorage
  window.localStorage.setItem('supabase.auth.token', JSON.stringify({
    currentSession: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: defaultUser
    }
  }));
});
