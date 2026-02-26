/**
 * AgendarBrasil - Testes E2E do Agendamento
 * Testa o fluxo de agendamento com mocks Supabase.
 */

describe('Página de Agendamento', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Filtros de Busca', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/rest/v1/rpc/get_available_states', {
        statusCode: 200,
        body: [
          { uf: 'SP', nome: 'São Paulo' },
          { uf: 'RJ', nome: 'Rio de Janeiro' },
        ],
      }).as('getStates');

      cy.intercept('POST', '**/rest/v1/rpc/get_available_cities', {
        statusCode: 200,
        body: [
          { cidade: 'São Paulo', estado: 'SP', total_medicos: 10 },
          { cidade: 'Campinas', estado: 'SP', total_medicos: 5 },
        ],
      }).as('getCities');

      cy.visit('/agendamento');
    });

    it('Deve exibir os selects de filtro', () => {
      cy.get('[data-testid="specialty-select"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="state-select"]').should('exist');
      cy.get('[data-testid="city-select"]').should('exist');
      cy.get('[data-testid="search-button"]').should('exist');
    });

    it('Deve ter o botão de busca desabilitado inicialmente', () => {
      cy.get('[data-testid="search-button"]').should('be.disabled');
    });

    it('Deve desabilitar select de cidade quando estado não estiver selecionado', () => {
      cy.get('[data-testid="city-select"]').should('have.attr', 'aria-disabled', 'true');
    });

    it('Deve exibir título da página', () => {
      cy.contains('Agendar Consulta').should('be.visible');
    });
  });

  describe('Responsividade Mobile', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
      cy.visit('/agendamento');
    });

    it('Deve exibir formulário de busca em mobile', () => {
      cy.get('[data-testid="specialty-select"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="search-button"]').should('be.visible');
      cy.contains('Agendar Consulta').should('be.visible');
    });
  });

  describe('Navegação', () => {
    it('Deve voltar para a home ao clicar em Início', () => {
      cy.visit('/agendamento');
      cy.contains('button', 'Início').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });
});
