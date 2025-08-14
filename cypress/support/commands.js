// Comandos customizados para os testes do AgendarBrasil Health Hub

/**
 * Comando para realizar busca por especialista
 * @param {string} specialty - Nome da especialidade
 * @param {string} location - Localização para busca
 */
Cypress.Commands.add('searchSpecialist', (specialty, location) => {
  cy.get('[data-testid="search-specialty-input"]')
    .clear()
    .type(specialty);
  
  cy.get('[data-testid="search-location-input"]')
    .clear()
    .type(location);
  
  cy.get('[data-testid="search-button"]').click();
  
  // Aguardar carregamento
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 })
    .should('not.exist');
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
 * Comando para verificar se um elemento está carregando
 * @param {string} selector - Seletor do elemento de loading
 */
Cypress.Commands.add('waitForLoading', (selector = '[data-testid="loading-spinner"]') => {
  cy.get(selector, { timeout: 15000 }).should('not.exist');
});

/**
 * Comando para verificar informações básicas de um card de médico
 */
Cypress.Commands.add('verifyDoctorCard', () => {
  cy.get('[data-testid="doctor-name"]')
    .should('be.visible')
    .and('not.be.empty');
  
  cy.get('[data-testid="doctor-specialty"]')
    .should('be.visible')
    .and('not.be.empty');
  
  cy.get('[data-testid="doctor-photo"]')
    .should('be.visible')
    .and('have.attr', 'src');
});

/**
 * Comando para selecionar primeiro horário disponível
 */
Cypress.Commands.add('selectFirstAvailableSlot', () => {
  cy.waitForLoading('[data-testid="loading-slots"]');
  
  cy.get('[data-testid="time-slot"]')
    .should('have.length.at.least', 1);
  
  cy.get('[data-testid="time-slot"]')
    .first()
    .should('be.visible')
    .and('not.have.class', 'disabled')
    .click();
});

/**
 * Comando para verificar modal de confirmação
 */
Cypress.Commands.add('verifyConfirmationModal', () => {
  cy.get('[data-testid="appointment-confirmation-modal"]')
    .should('be.visible');
  
  cy.get('[data-testid="confirmation-doctor-name"]')
    .should('be.visible')
    .and('not.be.empty');
  
  cy.get('[data-testid="confirmation-date"]')
    .should('be.visible')
    .and('not.be.empty');
  
  cy.get('[data-testid="confirmation-time"]')
    .should('be.visible')
    .and('not.be.empty');
});

/**
 * Comando para verificar mensagem de sucesso
 */
Cypress.Commands.add('verifySuccessMessage', () => {
  cy.get('[data-testid="success-message"]')
    .should('be.visible')
    .and('contain.text', 'sucesso');
  
  cy.get('[data-testid="appointment-confirmation-details"]')
    .should('be.visible');
  
  cy.get('[data-testid="appointment-reference"]')
    .should('be.visible')
    .and('not.be.empty');
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
 * Comando para interceptar chamadas da API
 */
Cypress.Commands.add('interceptApiCalls', () => {
  // Interceptar busca de especialistas
  cy.intercept('GET', '**/api/doctors/search**', { fixture: 'doctors.json' })
    .as('searchDoctors');
  
  // Interceptar horários disponíveis
  cy.intercept('GET', '**/api/doctors/*/availability**', { fixture: 'availability.json' })
    .as('getAvailability');
  
  // Interceptar criação de agendamento
  cy.intercept('POST', '**/api/appointments', { fixture: 'appointment-success.json' })
    .as('createAppointment');
});

/**
 * Comando para verificar acessibilidade básica
 */
Cypress.Commands.add('checkBasicAccessibility', () => {
  // Verificar se elementos têm labels apropriados
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

// Comando para aguardar elemento aparecer com retry
Cypress.Commands.add('waitForElement', (selector, options = {}) => {
  const defaultOptions = {
    timeout: 10000,
    interval: 500,
    ...options
  };
  
  cy.get(selector, { timeout: defaultOptions.timeout })
    .should('be.visible');
});