/**
 * AgendarBrasil Health Hub - Testes E2E da Página Inicial
 * AgendarBrasil Health Hub - Suíte de Testes Cypress
 */

describe('Página Inicial e Ações Primárias', () => {
  beforeEach(() => {
    // Visitar a página inicial antes de cada teste
    cy.visit('/');
    
    // Aguardar o carregamento completo da página
    cy.get('header').should('be.visible');
    cy.get('main').should('be.visible');
  });

  describe('Navegação e Autenticação', () => {
    it('Deve navegar para a página de login', () => {
      // Localizar e clicar no botão "Entrar" no cabeçalho
      cy.get('header button')
        .contains('Entrar')
        .should('be.visible')
        .click();

      // Verificar redirecionamento para página de login
      cy.url().should('include', '/login');
      
      // Verificar se a página de login carregou corretamente
      cy.get('main').should('be.visible');
      
      // Verificar elementos típicos de uma página de login
      cy.get('input[type="email"], input[type="text"]').should('exist');
      cy.get('input[type="password"]').should('exist');
    });

    it('Deve navegar para a página de cadastro', () => {
      // Para usuários não logados, o botão "Criar Conta Grátis" está na seção principal
      cy.get('button')
        .contains('Criar Conta Grátis')
        .should('be.visible')
        .click();

      // Verificar redirecionamento para página de login (que inclui cadastro)
      cy.url().should('include', '/login');
      
      // Verificar se a página carregou corretamente
      cy.get('main').should('be.visible');
    });
  });

  describe('Busca de Especialidades', () => {
    it('Deve realizar uma busca com sucesso', () => {
      // Localizar e preencher o campo de especialidade
      // Seletor: Botão "Agendar Consulta" na seção de boas-vindas
      cy.get('button')
        .contains('Agendar Consulta')
        .should('be.visible')
        .click();

      // Verificar redirecionamento para página de agendamento
      cy.url().should('include', '/agendamento');
      
      // Verificar se chegou na primeira etapa (seleção de especialidade)
      cy.get('[role="main"]').should('contain', 'Agendar Consulta');
      cy.get('h2').contains('Etapa 1').should('exist');
      
      // Selecionar especialidade "Cardiologia" se disponível
      cy.get('[role="combobox"]').first().click();
      cy.get('[role="option"]')
        .contains('Cardiologia')
        .should('be.visible')
        .click();
      
      // Verificar se a especialidade foi selecionada
      cy.get('[role="combobox"]').first().should('contain', 'Cardiologia');
      
      // Clicar no botão "Próximo" para avançar
      cy.get('button')
        .contains('Próximo')
        .should('not.be.disabled')
        .click();
      
      // Verificar se avançou para a próxima etapa (Estado)
      cy.get('h2').contains('Etapa 2').should('exist');
      cy.get('[role="main"]').should('contain', 'Selecione o Estado');
    });
  });

  describe('Ações Rápidas da Página Inicial', () => {
    it('Deve acessar a agenda do paciente', () => {
      // Clicar no botão "Minha Agenda"
      cy.get('button')
        .contains('Minha Agenda')
        .should('be.visible')
        .click();

      // Para usuários não logados, deve redirecionar para login
      cy.url().should('include', '/login');
    });

    it('Deve acessar gestão de medicamentos', () => {
      // Clicar no botão "Medicamentos"
      cy.get('button')
        .contains('Medicamentos')
        .should('be.visible')
        .click();

      // Para usuários não logados, deve redirecionar para login
      cy.url().should('include', '/login');
    });

    it('Deve acessar histórico médico', () => {
      // Clicar no botão "Histórico"
      cy.get('button')
        .contains('Histórico')
        .should('be.visible')
        .click();

      // Para usuários não logados, deve redirecionar para login
      cy.url().should('include', '/login');
    });

    it('Deve acessar perfil do usuário', () => {
      // Clicar no botão "Perfil"
      cy.get('button')
        .contains('Perfil')
        .should('be.visible')
        .click();

      // Para usuários não logados, deve redirecionar para login
      cy.url().should('include', '/login');
    });

    it('Deve mostrar contatos de emergência', () => {
      // Clicar no botão "Emergência"
      cy.get('button')
        .contains('Emergência')
        .should('be.visible')
        .click();

      // Verificar se o toast de emergência aparece
      cy.get('[role="alert"], .toast, [data-testid="toast"]')
        .should('be.visible')
        .and('contain', 'SAMU: 192');
    });
  });

  describe('Responsividade e Acessibilidade', () => {
    it('Deve funcionar em dispositivos móveis', () => {
      // Testar em viewport mobile
      cy.viewport(375, 667);
      
      // Verificar se os elementos principais estão visíveis
      cy.get('header').should('be.visible');
      cy.get('main').should('be.visible');
      
      // Verificar se os botões são clicáveis em mobile
      cy.get('button').contains('Agendar Consulta')
        .should('be.visible')
        .and('not.be.disabled');
    });

    it('Deve ter elementos acessíveis', () => {
      // Verificar se elementos têm labels apropriados
      cy.get('button').each(($btn) => {
        cy.wrap($btn).should('have.attr', 'aria-label').or('contain.text');
      });
      
      // Verificar navegação por teclado
      cy.get('body').tab();
      cy.focused().should('be.visible');
    });
  });

  describe('Performance e Carregamento', () => {
    it('Deve carregar a página em tempo hábil', () => {
      // Verificar se a página carrega em menos de 3 segundos
      cy.visit('/', { timeout: 3000 });
      
      // Verificar se elementos críticos estão presentes
      cy.get('header').should('be.visible');
      cy.get('main').should('be.visible');
      cy.get('button').contains('Agendar Consulta').should('be.visible');
    });

    it('Deve lidar com erros de rede graciosamente', () => {
      // Simular falha de rede
      cy.intercept('GET', '**/api/**', { forceNetworkError: true });
      
      // Verificar se a página ainda funciona básicamente
      cy.visit('/');
      cy.get('header').should('be.visible');
      cy.get('main').should('be.visible');
    });

    it('Deve ter navegação por teclado funcional', () => {
      // Testar navegação por Tab
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Verificar se consegue navegar pelos botões principais
      cy.get('button').contains('Entrar').focus().should('be.focused');
    });
  });
});

// replaced by kiro @2025-01-08T15:30:00.000Z