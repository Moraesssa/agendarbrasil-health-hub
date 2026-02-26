// Comandos customizados para os testes do AgendarBrasil Health Hub

/**
 * Comando para selecionar uma especialidade
 */
Cypress.Commands.add('selectSpecialty', (specialty) => {
  cy.get('[data-testid="specialty-select"]').click();
  cy.contains('[role="option"]', specialty).click();
});

/**
 * Comando para selecionar um estado
 */
Cypress.Commands.add('selectState', (state) => {
  cy.get('[data-testid="state-select"]').click();
  cy.contains('[role="option"]', state).click();
});

/**
 * Comando para selecionar uma cidade
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
 */
Cypress.Commands.add('selectDoctor', (index = 0) => {
  cy.get('[data-testid="doctor-card"]')
    .eq(index)
    .find('[data-testid="select-doctor-button"]')
    .click();
});

/**
 * Comando para selecionar um horário pelo índice
 */
Cypress.Commands.add('selectTimeSlot', (index = 0) => {
  cy.get('[data-testid="time-slot"]')
    .eq(index)
    .click();
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
  cy.intercept('POST', '**/rest/v1/rpc/get_specialties', {
    statusCode: 200,
    body: ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Pediatria', 'Neurologia'],
  }).as('getSpecialties');

  cy.intercept('POST', '**/rest/v1/rpc/get_available_states', {
    statusCode: 200,
    body: [
      { uf: 'SP', nome: 'São Paulo' },
      { uf: 'RJ', nome: 'Rio de Janeiro' },
      { uf: 'MG', nome: 'Minas Gerais' },
    ],
  }).as('getStates');

  cy.intercept('POST', '**/rest/v1/rpc/get_available_cities', {
    statusCode: 200,
    body: [
      { cidade: 'São Paulo', estado: 'SP', total_medicos: 15 },
      { cidade: 'Campinas', estado: 'SP', total_medicos: 8 },
    ],
  }).as('getCities');

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
        foto_perfil_url: null,
      },
    ],
  }).as('getMedicos');

  cy.intercept('POST', '**/rest/v1/rpc/get_available_time_slots', {
    statusCode: 200,
    body: {
      slots: [
        { time: '08:00', available: true },
        { time: '09:00', available: true },
        { time: '14:00', available: true },
      ],
    },
  }).as('getTimeSlots');
});

/**
 * Comando para aguardar elemento aparecer
 */
Cypress.Commands.add('waitForElement', (selector, options = {}) => {
  cy.get(selector, { timeout: options.timeout || 10000 }).should('be.visible');
});
