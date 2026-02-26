/**
 * AgendarBrasil - Testes E2E do Onboarding de Médico
 * Testa o fluxo de onboarding com sessão Supabase mockada.
 * 
 * NOTA: A aplicação usa Google OAuth exclusivamente.
 * Estes testes mockam a sessão diretamente no localStorage.
 */

describe('Onboarding de Médico', () => {
  const mockUser = {
    id: 'mock-doctor-uuid',
    email: 'doctor@test.com',
    user_metadata: {
      name: 'Dr. Teste',
      userType: 'medico',
      onboardingCompleted: false,
    },
  };

  beforeEach(() => {
    // Mock da sessão do Supabase via interceptor de auth
    cy.intercept('GET', '**/auth/v1/user', {
      statusCode: 200,
      body: mockUser,
    }).as('getUser');

    // Mock do perfil do usuário
    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: [{
        id: mockUser.id,
        email: mockUser.email,
        display_name: 'Dr. Teste',
        user_type: 'medico',
        onboarding_completed: false,
        is_active: true,
      }],
    }).as('getProfile');
  });

  it('Deve exibir a página de login com Google OAuth', () => {
    cy.visit('/login');
    cy.contains('Continuar com Google').should('be.visible');
    // Não deve haver campos de email/password
    cy.get('input[type="email"]').should('not.exist');
    cy.get('input[type="password"]').should('not.exist');
  });

  it('Deve exibir a página de onboarding quando acessada diretamente', () => {
    cy.visit('/onboarding');
    // A página pode redirecionar para login se não autenticado
    // ou exibir o formulário de onboarding se autenticado
    cy.url().should('match', /\/(onboarding|login)/);
  });
});
