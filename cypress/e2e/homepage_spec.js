/**
 * AgendarBrasil - Testes E2E da Página Inicial
 * Testa funcionalidades reais da homepage para usuários não autenticados.
 */

describe('Página Inicial', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('header', { timeout: 10000 }).should('be.visible');
    cy.get('main').should('be.visible');
  });

  describe('Carregamento e Estrutura', () => {
    it('Deve exibir o título AgendarBrasil', () => {
      cy.contains('AgendarBrasil').should('be.visible');
    });

    it('Deve exibir a mensagem de saúde', () => {
      cy.contains('Sua saúde em primeiro lugar').should('be.visible');
    });

    it('Deve exibir botões de ação rápida', () => {
      cy.contains('button', 'Agendar Consulta').should('be.visible');
      cy.contains('button', 'Minha Agenda').should('be.visible');
      cy.contains('button', 'Medicamentos').should('be.visible');
      cy.contains('button', 'Histórico').should('be.visible');
      cy.contains('button', 'Perfil').should('be.visible');
      cy.contains('button', 'Emergência').should('be.visible');
    });
  });

  describe('Navegação - Usuário Não Autenticado', () => {
    it('Deve navegar para /login ao clicar em "Entrar"', () => {
      cy.get('header').contains('button', 'Entrar').click();
      cy.url().should('include', '/login');
    });

    it('Deve redirecionar para /login ao clicar em "Agendar Consulta"', () => {
      cy.contains('button', 'Agendar Consulta').first().click();
      cy.url().should('include', '/login');
    });

    it('Deve redirecionar para /login ao clicar em "Minha Agenda"', () => {
      cy.contains('button', 'Minha Agenda').click();
      cy.url().should('include', '/login');
    });

    it('Deve redirecionar para /login ao clicar em "Medicamentos"', () => {
      cy.contains('button', 'Medicamentos').click();
      cy.url().should('include', '/login');
    });

    it('Deve redirecionar para /login ao clicar em "Histórico"', () => {
      cy.contains('button', 'Histórico').click();
      cy.url().should('include', '/login');
    });

    it('Deve redirecionar para /login ao clicar em "Perfil"', () => {
      cy.contains('button', 'Perfil').click();
      cy.url().should('include', '/login');
    });
  });

  describe('Emergência', () => {
    it('Deve exibir contatos de emergência ao clicar no botão', () => {
      cy.contains('button', 'Emergência').click();
      cy.contains('SAMU: 192').should('be.visible');
    });
  });

  describe('Página de Login', () => {
    it('Deve exibir login com Google (sem formulário email/senha)', () => {
      cy.visit('/login');
      cy.contains('Continuar com Google').should('be.visible');
      // Não deve haver campos de email/password
      cy.get('input[type="email"]').should('not.exist');
      cy.get('input[type="password"]').should('not.exist');
    });

    it('Deve ter botão de voltar para a home', () => {
      cy.visit('/login');
      cy.contains('button', 'Voltar').should('be.visible');
      cy.contains('button', 'Voltar').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Responsividade Mobile', () => {
    it('Deve funcionar em viewport mobile', () => {
      cy.viewport(375, 667);
      cy.get('header').should('be.visible');
      cy.get('main').should('be.visible');
      cy.contains('button', 'Agendar Consulta').should('be.visible');
      cy.contains('button', 'Emergência').should('be.visible');
    });
  });
});
