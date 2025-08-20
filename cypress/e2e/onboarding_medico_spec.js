/**
 * Testes E2E para o fluxo de Onboarding de Médicos
 */
describe('Onboarding de Médico', () => {
  let newUser;

  beforeEach(() => {
    // Gerar um novo usuário para cada teste para garantir isolamento
    const uniqueId = Date.now();
    newUser = {
      id: `user_${uniqueId}`,
      email: `doctor_${uniqueId}@abracadabra.com`,
      user_metadata: {
        name: 'Dr. Abra Cadabra',
      },
    };

    // Mock da sessão do Supabase
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
        user: newUser,
      },
    }).as('supabaseLogin');

    // Mock dos dados do usuário para o hook useAuth
    cy.intercept('GET', '**/auth/v1/user', {
      statusCode: 200,
      body: {
        ...newUser,
        user_metadata: {
          ...newUser.user_metadata,
          userType: 'medico',
          onboardingCompleted: false,
        }
      },
    }).as('supabaseGetUser');

    // Mock da chamada de finalização do onboarding
    cy.intercept('POST', '**/rest/v1/medicos?on_conflict=user_id', (req) => {
      req.reply({
        statusCode: 201,
        body: [{ ...req.body, user_id: newUser.id }],
      });
    }).as('finishOnboarding');

    cy.intercept('POST', '**/rest/v1/enderecos', (req) => {
      req.reply({
        statusCode: 201,
        body: [{ ...req.body }],
      });
    }).as('finishOnboarding');

    // Visitar a página de login para iniciar o fluxo
    cy.visit('/login');
    cy.get('input[name="email"]').type(newUser.email);
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@supabaseLogin');
    cy.wait('@supabaseGetUser');
  });

  it('deve permitir que um novo médico complete o fluxo de onboarding', () => {
    // Estamos na página de onboarding
    cy.url().should('include', '/onboarding');
    cy.contains('h1', 'Complete seu cadastro').should('be.visible');

    // Passo 1: Dados Profissionais
    cy.get('[data-testid="crm-input"]').type('123456');
    cy.get('[data-testid="especialidade-select"]').click();
    cy.get('[data-testid="select-item-cardiologia"]').click();
    cy.get('[data-testid="form-step-1-next"]').click();

    // Passo 2: Endereço
    cy.get('[data-testid="cep-input"]').type('01001000');
    cy.get('[data-testid="logradouro-input"]').should('have.value', 'Praça da Sé');
    cy.get('[data-testid="numero-input"]').type('100');
    cy.get('[data-testid="bairro-input"]').should('have.value', 'Sé');
    cy.get('[data-testid="cidade-input"]').should('have.value', 'São Paulo');
    cy.get('[data-testid="uf-input"]').should('have.value', 'SP');
    cy.get('[data-testid="form-step-2-next"]').click();

    // Passo 3: Configurações
    cy.get('[data-testid="valor-consulta-input"]').type('30000');
    cy.get('[data-testid="duracao-consulta-select"]').click();
    cy.get('[data-testid="select-item-30"]').click();
    cy.get('[data-testid="form-step-3-next"]').click();

    // Passo 4: Finalização
    cy.contains('h1', 'Finalização').should('be.visible');
    cy.get('[data-testid="finish-onboarding-button"]').click();

    // Verificar se o onboarding foi finalizado com sucesso
    cy.wait('@finishOnboarding');

    // Verificar redirecionamento para o perfil do médico
    cy.url().should('include', '/perfil-medico');
    cy.contains('h1', 'Perfil do Médico').should('be.visible');
  });
});
